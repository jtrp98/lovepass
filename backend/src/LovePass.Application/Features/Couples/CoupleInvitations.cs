using System.Security.Cryptography;
using FluentValidation;
using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using LovePass.Application.Common.Models;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace LovePass.Application.Features.Couples;

public sealed record InvitationResultDto(string InviteToken, string InviteLink, DateTime ExpiresAt);

public sealed record CreateInvitationCommand() : ICommand<InvitationResultDto>;

public sealed class CreateInvitationCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IOptions<AppOptions> app)
    : IRequestHandler<CreateInvitationCommand, InvitationResultDto>
{
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromDays(7);

    public async Task<InvitationResultDto> Handle(CreateInvitationCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();
        await EnsureNotCoupled(db, userId, cancellationToken);

        var invitation = new CoupleInvitation
        {
            InviterId = userId,
            InviteToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(16)),
            ExpiresAt = DateTime.UtcNow.Add(TokenLifetime),
            Status = InvitationStatus.Pending
        };

        db.CoupleInvitations.Add(invitation);
        await db.SaveChangesAsync(cancellationToken);

        var link = $"{app.Value.FrontendUrl}/couple/accept?token={invitation.InviteToken}";
        return new InvitationResultDto(invitation.InviteToken, link, invitation.ExpiresAt);
    }

    internal static async Task EnsureNotCoupled(IApplicationDbContext db, int userId, CancellationToken cancellationToken)
    {
        var coupled = await db.CoupleMembers
            .AnyAsync(m => m.UserId == userId && m.Couple!.Status == CoupleStatus.Active, cancellationToken);
        if (coupled) throw new ConflictException("คุณจับคู่อยู่แล้ว — ต้องยกเลิกคู่ปัจจุบันก่อนจึงจะสร้างคำเชิญใหม่ได้");
    }
}

public sealed record AcceptInvitationCommand(string Token) : ICommand<CoupleDto>;

public sealed class AcceptInvitationValidator : AbstractValidator<AcceptInvitationCommand>
{
    public AcceptInvitationValidator()
        => RuleFor(x => x.Token).NotEmpty().Length(16, 128);
}

public sealed class AcceptInvitationCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<AcceptInvitationCommand, CoupleDto>
{
    public async Task<CoupleDto> Handle(AcceptInvitationCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();

        var invitation = await db.CoupleInvitations
            .Include(i => i.Inviter)
            .FirstOrDefaultAsync(i => i.InviteToken == request.Token, cancellationToken)
            ?? throw new NotFoundException(nameof(CoupleInvitation), request.Token);

        if (invitation.Status != InvitationStatus.Pending)
            throw new ConflictException("คำเชิญนี้ใช้ไปแล้ว");

        if (invitation.IsExpired)
        {
            invitation.Status = InvitationStatus.Expired;
            await db.SaveChangesAsync(cancellationToken);
            throw new ConflictException("คำเชิญหมดอายุแล้ว");
        }

        if (invitation.InviterId == userId)
            throw new ConflictException("ไม่สามารถยอมรับคำเชิญของตัวเองได้");

        await CreateInvitationCommandHandler.EnsureNotCoupled(db, userId, cancellationToken);
        await CreateInvitationCommandHandler.EnsureNotCoupled(db, invitation.InviterId, cancellationToken);

        var couple = new Couple { Status = CoupleStatus.Active };
        couple.Members.Add(new CoupleMember { UserId = invitation.InviterId });
        couple.Members.Add(new CoupleMember { UserId = userId });

        invitation.Status = InvitationStatus.Accepted;
        db.Couples.Add(couple);
        await db.SaveChangesAsync(cancellationToken);

        return new CoupleDto(
            couple.Id,
            invitation.Inviter!.Id,
            invitation.Inviter.DisplayName,
            invitation.Inviter.Email ?? string.Empty,
            couple.CreatedAt == default ? DateTime.UtcNow : couple.CreatedAt);
    }
}
