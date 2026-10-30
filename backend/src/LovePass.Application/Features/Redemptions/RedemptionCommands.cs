using FluentValidation;
using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using LovePass.Application.Common.Models;
using LovePass.Application.Common.Services;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using LovePass.Domain.Rules;
using LovePass.Domain.ValueObjects;
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
    DateTime CouponExpiresAt,
    string Category = "OTHER",
    string Effect = "NONE",
    string? TargetName = null,
    string? TargetRarity = null,
    string? TargetCategory = null);

/// <summary>คูปองพลังพิเศษส่งเป้าหมายมาด้วย: TargetIssuedCouponId (ต่อเวลา, FAST PASS, UPGRADE, REPLAY) หรือ TargetTemplateId (WILDCARD)</summary>
public sealed record RequestRedemptionCommand(int IssuedCouponId, string? Message, int? TargetIssuedCouponId = null, int? TargetTemplateId = null)
    : ICommand<RedemptionDto>;

public sealed class RequestRedemptionCommandValidator : AbstractValidator<RequestRedemptionCommand>
{
    public RequestRedemptionCommandValidator()
    {
        RuleFor(x => x.IssuedCouponId).NotEmpty();
        RuleFor(x => x.Message).MaximumLength(500);
        RuleFor(x => x.TargetIssuedCouponId).GreaterThan(0).When(x => x.TargetIssuedCouponId is not null);
        RuleFor(x => x.TargetTemplateId).GreaterThan(0).When(x => x.TargetTemplateId is not null);
        RuleFor(x => x).Must(x => x.TargetIssuedCouponId is null || x.TargetTemplateId is null)
            .WithMessage("เลือกเป้าหมายได้อย่างเดียว คูปองที่มีอยู่หรือคูปองจากคลัง");
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

        // คู่ที่ยกเลิกไปแล้วดูได้เฉพาะประวัติ ขอใช้คูปองต่อไม่ได้
        var stillCoupled = await db.CoupleMembers.AnyAsync(m => m.UserId == userId
            && m.Couple!.Status == CoupleStatus.Active
            && m.Couple.Members.Any(o => o.UserId == coupon.SenderId), cancellationToken);
        if (!stillCoupled)
            throw new ConflictException("คุณสองคนไม่ได้จับคู่กันแล้ว คูปองใบนี้เก็บไว้ดูเป็นความทรงจำได้อย่างเดียว");

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

        await AttachTargetAsync(coupon, request, redemption, cancellationToken);

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
            var targetName = redemption.TargetSnapshot is null ? null : CouponTemplateSnapshot.FromJson(redemption.TargetSnapshot).Name;
            var (subject, html) = EmailTemplates.RedemptionRequested(
                approver.DisplayName, requester.DisplayName, snapshot.Name, snapshot.Rarity,
                redemption.Message, coupon.Id, appOptions.Value, targetName);
            await emailSender.SendEmailAsync(approver.Email, subject, html, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send redemption request email for redemption {RedemptionId}", redemption.Id);
        }
    }

    /// <summary>คูปองพลังพิเศษต้องมีเป้าหมายที่ผ่านกติกา คูปองปกติต้องไม่ส่งเป้าหมายมา</summary>
    private async Task AttachTargetAsync(IssuedCoupon coupon, RequestRedemptionCommand request, Redemption redemption, CancellationToken cancellationToken)
    {
        var effect = MetaCouponRules.EffectOf(coupon.ReadSnapshot());
        if (effect == CouponEffect.None)
        {
            if (request.TargetIssuedCouponId is not null || request.TargetTemplateId is not null)
                throw new ConflictException("คูปองนี้ไม่ต้องเลือกคูปองเป้าหมาย");
            return;
        }

        if (effect == CouponEffect.Wildcard)
        {
            var templateId = request.TargetTemplateId ?? throw new ConflictException("เลือกคูปองจากคลังที่อยากให้ WILDCARD กลายเป็นก่อนนะ");
            var template = await db.CouponTemplates.FirstOrDefaultAsync(t => t.Id == templateId, cancellationToken)
                ?? throw new NotFoundException(nameof(CouponTemplate), templateId);
            ThrowIfBroken(MetaCouponRules.CheckTemplateTarget(effect, template));
            redemption.TargetTemplateId = template.Id;
            redemption.TargetSnapshot = CouponTemplateSnapshot.Of(template).ToJson();
            return;
        }

        var targetId = request.TargetIssuedCouponId ?? throw new ConflictException("เลือกคูปองที่จะใช้พลังนี้ก่อนนะ");
        var target = await db.IssuedCoupons.FirstOrDefaultAsync(c => c.Id == targetId, cancellationToken)
            ?? throw new NotFoundException(nameof(IssuedCoupon), targetId);
        ThrowIfBroken(MetaCouponRules.CheckCouponTarget(effect, coupon, target));
        if (MetaCouponRules.ReservesTarget(effect) && !target.TryReserve())
            throw new ConflictException("คูปองที่เลือกมีคำขอค้างอยู่เต็มจำนวนแล้ว");
        redemption.TargetIssuedCouponId = target.Id;
        redemption.TargetSnapshot = target.TemplateSnapshot;
    }

    private static void ThrowIfBroken(string? rule)
    {
        if (rule is not null) throw new ConflictException(rule);
    }

    internal static RedemptionDto Map(Redemption r, IssuedCoupon coupon, string requesterName, string? approverName = null)
    {
        var s = coupon.ReadSnapshot();
        var target = r.TargetSnapshot is null ? null : CouponTemplateSnapshot.FromJson(r.TargetSnapshot);
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
            coupon.ExpiresAt,
            s.Category,
            s.Effect,
            target?.Name,
            target?.Rarity,
            target?.Category);
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

        await MetaTargetEffects.ApplyOnApproveAsync(db, redemption, coupon, cancellationToken);

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
        await MetaTargetEffects.ReleaseAsync(db, redemption, coupon, cancellationToken);

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
        await MetaTargetEffects.ReleaseAsync(db, redemption, redemption.IssuedCoupon, cancellationToken);

        redemption.Status = RedemptionStatus.Cancelled;
        redemption.ResolvedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var requesterName = await identity.GetDisplayNameOrIdAsync(redemption.RequesterId, cancellationToken);
        return RequestRedemptionCommandHandler.Map(redemption, redemption.IssuedCoupon, requesterName);
    }
}

/// <summary>ผลของคูปองพลังพิเศษกับคูปองเป้าหมายที่ถูกกันสิทธิ์ไว้ — ทำใน transaction เดียวกับคำสั่งหลัก</summary>
file static class MetaTargetEffects
{
    public static async Task ApplyOnApproveAsync(IApplicationDbContext db, Redemption redemption, IssuedCoupon meta, CancellationToken cancellationToken)
    {
        var effect = MetaCouponRules.EffectOf(meta.ReadSnapshot());
        if (!MetaCouponRules.ReservesTarget(effect)) return;

        var target = await LoadTargetAsync(db, redemption, cancellationToken);
        if (effect == CouponEffect.Extend)
        {
            if (!target.TryExtendReservedUnit(MetaCouponRules.ExtendBy, out var split))
                throw new ConflictException("ไม่พบสิทธิ์ที่กันไว้ของคูปองที่จะต่อเวลา");
            if (split is not null) db.IssuedCoupons.Add(split);
            return;
        }

        if (target.IsExpired)
            throw new ConflictException("คูปองที่ใช้คู่กันหมดอายุแล้ว ปฏิเสธคำขอนี้เพื่อคืนสิทธิ์ทั้งสองใบได้");
        if (!target.TryConfirmRedemption())
            throw new ConflictException("สิทธิ์ของคูปองที่ใช้คู่กันไม่พอให้ยืนยัน");
    }

    public static async Task ReleaseAsync(IApplicationDbContext db, Redemption redemption, IssuedCoupon meta, CancellationToken cancellationToken)
    {
        if (!MetaCouponRules.ReservesTarget(MetaCouponRules.EffectOf(meta.ReadSnapshot()))) return;
        var target = await LoadTargetAsync(db, redemption, cancellationToken);
        if (!target.TryReleaseReservation())
            throw new ConflictException("ไม่พบสิทธิ์ที่กันไว้ของคูปองที่ใช้คู่กัน");
    }

    private static async Task<IssuedCoupon> LoadTargetAsync(IApplicationDbContext db, Redemption redemption, CancellationToken cancellationToken)
    {
        var targetId = redemption.TargetIssuedCouponId
            ?? throw new ConflictException("คำขอนี้ไม่มีคูปองเป้าหมาย");
        return await db.IssuedCoupons.FirstOrDefaultAsync(c => c.Id == targetId, cancellationToken)
            ?? throw new NotFoundException(nameof(IssuedCoupon), targetId);
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
