using FluentValidation;
using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using LovePass.Application.Common.Models;
using LovePass.Application.Common.Services;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LovePass.Application.Features.Redemptions;

public sealed record RedemptionDto(
    int Id,
    int IssuedCouponId,
    string CouponName,
    string Rarity,
    string? Emoji,
    int RequesterId,
    string RequesterName,
    int? ApproverId,
    string? ApproverName,
    string? Message,
    string Status,
    DateTime RequestedAt,
    DateTime? ResolvedAt,
    DateTime CouponExpiresAt);

public sealed record RequestRedemptionCommand(int IssuedCouponId, string? Message) : ICommand<RedemptionDto>;

public sealed class RequestRedemptionCommandValidator : AbstractValidator<RequestRedemptionCommand>
{
    public RequestRedemptionCommandValidator()
    {
        RuleFor(x => x.IssuedCouponId).NotEmpty();
        RuleFor(x => x.Message).MaximumLength(500);
    }
}

public sealed class RequestRedemptionCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IIdentityService identity,
    IEmailSender emailSender,
    IOptions<AppOptions> appOptions,
    ILogger<RequestRedemptionCommandHandler> logger)
    : IRequestHandler<RequestRedemptionCommand, RedemptionDto>
{
    public async Task<RedemptionDto> Handle(RequestRedemptionCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();

        var coupon = await db.IssuedCoupons
            .FirstOrDefaultAsync(c => c.Id == request.IssuedCouponId, cancellationToken)
            ?? throw new NotFoundException(nameof(IssuedCoupon), request.IssuedCouponId);

        if (coupon.ReceiverId != userId)
            throw new ForbiddenAccessException();

        if (coupon.IsExpired)
            throw new ConflictException("คูปองนี้หมดอายุแล้ว");

        if (!coupon.TryReserve())
            throw new ConflictException("จำนวนคูปองคงเหลือไม่พอ หรือมีคำขอที่รออยู่เต็มจำนวนแล้ว");

        var redemption = new Redemption
        {
            IssuedCouponId = coupon.Id,
            RequesterId = userId,
            Message = request.Message,
            Status = RedemptionStatus.Pending,
            RequestedAt = DateTime.UtcNow
        };

        db.Redemptions.Add(redemption);
        await db.SaveChangesAsync(cancellationToken);

        await TryNotifyApproverAsync(coupon, redemption, cancellationToken);

        return Map(redemption, coupon, (await identity.GetUserAsync(userId, cancellationToken)).DisplayName);
    }

    private async Task TryNotifyApproverAsync(IssuedCoupon coupon, Redemption redemption, CancellationToken cancellationToken)
    {
        try
        {
            var requester = await identity.GetUserAsync(redemption.RequesterId, cancellationToken);
            var approver = await identity.GetUserAsync(coupon.SenderId, cancellationToken);
            var snapshot = coupon.ReadSnapshot();
            var (subject, html) = EmailTemplates.RedemptionRequested(
                approver.DisplayName, requester.DisplayName, snapshot.Name, snapshot.Rarity,
                redemption.Message, coupon.Id, appOptions.Value);
            await emailSender.SendEmailAsync(approver.Email, subject, html, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send redemption request email for redemption {RedemptionId}", redemption.Id);
        }
    }

    internal static RedemptionDto Map(Redemption r, IssuedCoupon coupon, string requesterName, string? approverName = null)
    {
        var s = coupon.ReadSnapshot();
        return new RedemptionDto(
            r.Id,
            coupon.Id,
            s.Name,
            s.Rarity,
            s.Emoji,
            r.RequesterId,
            requesterName,
            r.ApproverId,
            approverName,
            r.Message,
            r.Status.ToString().ToUpperInvariant(),
            r.RequestedAt,
            r.ResolvedAt,
            coupon.ExpiresAt);
    }
}

// ---------------- Approve / Reject / Cancel ----------------

public sealed record ApproveRedemptionCommand(int Id) : ICommand<RedemptionDto>;

public sealed class ApproveRedemptionCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IIdentityService identity,
    IEmailSender emailSender,
    IOptions<AppOptions> appOptions,
    ILogger<ApproveRedemptionCommandHandler> logger)
    : IRequestHandler<ApproveRedemptionCommand, RedemptionDto>
{
    public async Task<RedemptionDto> Handle(ApproveRedemptionCommand request, CancellationToken cancellationToken)
    {
        var (redemption, coupon) = await LoadOwnPendingAsync(db, currentUser.RequiredUserId(), request.Id, cancellationToken);

        if (coupon.IsExpired)
            throw new ConflictException("คูปองหมดอายุแล้ว ไม่สามารถอนุมัติได้");

        if (!coupon.TryConfirmRedemption())
            throw new ConflictException("สิทธิ์คูปองไม่พอให้อนุมัติ");

        redemption.Status = RedemptionStatus.Approved;
        redemption.ApproverId = currentUser.UserId;
        redemption.ResolvedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        await TryNotifyRequesterAsync(redemption, coupon, approved: true, cancellationToken);

        var requesterName = await identity.GetDisplayNameOrIdAsync(redemption.RequesterId, cancellationToken);
        var approverName = (await identity.GetUserAsync(currentUser.RequiredUserId(), cancellationToken)).DisplayName;
        return RequestRedemptionCommandHandler.Map(redemption, coupon, requesterName, approverName);
    }

    internal static async Task<(Redemption Redemption, IssuedCoupon Coupon)> LoadOwnPendingAsync(
        IApplicationDbContext db, int userId, int redemptionId, CancellationToken cancellationToken)
    {
        var redemption = await db.Redemptions
            .Include(r => r.IssuedCoupon)
            .FirstOrDefaultAsync(r => r.Id == redemptionId, cancellationToken)
            ?? throw new NotFoundException(nameof(Redemption), redemptionId);

        if (redemption.IssuedCoupon!.SenderId != userId)
            throw new ForbiddenAccessException();

        if (!redemption.IsPending)
            throw new ConflictException("คำขอนี้ดำเนินการไปแล้ว");

        return (redemption, redemption.IssuedCoupon);
    }

    private async Task TryNotifyRequesterAsync(Redemption redemption, IssuedCoupon coupon, bool approved, CancellationToken cancellationToken)
    {
        try
        {
            var requester = await identity.GetUserAsync(redemption.RequesterId, cancellationToken);
            var approver = await identity.GetUserAsync(coupon.SenderId, cancellationToken);
            var (subject, html) = EmailTemplates.RedemptionResolved(
                requester.DisplayName, approver.DisplayName, coupon.ReadSnapshot().Name, approved, appOptions.Value);
            await emailSender.SendEmailAsync(requester.Email, subject, html, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send redemption resolved email for redemption {RedemptionId}", redemption.Id);
        }
    }
}

public sealed record RejectRedemptionCommand(int Id) : ICommand<RedemptionDto>;

public sealed class RejectRedemptionCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IIdentityService identity,
    IEmailSender emailSender,
    IOptions<AppOptions> appOptions,
    ILogger<RejectRedemptionCommandHandler> logger)
    : IRequestHandler<RejectRedemptionCommand, RedemptionDto>
{
    public async Task<RedemptionDto> Handle(RejectRedemptionCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();
        var (redemption, coupon) = await ApproveRedemptionCommandHandler.LoadOwnPendingAsync(db, userId, request.Id, cancellationToken);

        if (!coupon.TryReleaseReservation())
            throw new ConflictException("ไม่พบสิทธิ์ที่กันไว้สำหรับคำขอนี้");

        redemption.Status = RedemptionStatus.Rejected;
        redemption.ApproverId = userId;
        redemption.ResolvedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        try
        {
            var requester = await identity.GetUserAsync(redemption.RequesterId, cancellationToken);
            var approver = await identity.GetUserAsync(coupon.SenderId, cancellationToken);
            var (subject, html) = EmailTemplates.RedemptionResolved(
                requester.DisplayName, approver.DisplayName, coupon.ReadSnapshot().Name, approved: false, appOptions.Value);
            await emailSender.SendEmailAsync(requester.Email, subject, html, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send redemption rejected email for redemption {RedemptionId}", redemption.Id);
        }

        var requesterName2 = await identity.GetDisplayNameOrIdAsync(redemption.RequesterId, cancellationToken);
        var approverName2 = (await identity.GetUserAsync(userId, cancellationToken)).DisplayName;
        return RequestRedemptionCommandHandler.Map(redemption, coupon, requesterName2, approverName2);
    }
}

public sealed record CancelRedemptionCommand(int Id) : ICommand<RedemptionDto>;

public sealed class CancelRedemptionCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IIdentityService identity)
    : IRequestHandler<CancelRedemptionCommand, RedemptionDto>
{
    public async Task<RedemptionDto> Handle(CancelRedemptionCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();

        var redemption = await db.Redemptions
            .Include(r => r.IssuedCoupon)
            .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Redemption), request.Id);

        if (redemption.RequesterId != userId)
            throw new ForbiddenAccessException();

        if (!redemption.IsPending)
            throw new ConflictException("คำขอนี้ดำเนินการไปแล้ว");

        if (!redemption.IssuedCoupon!.TryReleaseReservation())
            throw new ConflictException("ไม่พบสิทธิ์ที่กันไว้สำหรับคำขอนี้");

        redemption.Status = RedemptionStatus.Cancelled;
        redemption.ResolvedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var requesterName = await identity.GetDisplayNameOrIdAsync(redemption.RequesterId, cancellationToken);
        return RequestRedemptionCommandHandler.Map(redemption, redemption.IssuedCoupon, requesterName);
    }
}

file static class IdentityExtensions
{
    public static async Task<string> GetDisplayNameOrIdAsync(this IIdentityService identity, int userId, CancellationToken cancellationToken)
    {
        try
        {
            return (await identity.GetUserAsync(userId, cancellationToken)).DisplayName;
        }
        catch (NotFoundException)
        {
            return $"User #{userId}";
        }
    }

    public static string DisplayNameSafe(this CurrentUserDto user) => user.DisplayName;
}
