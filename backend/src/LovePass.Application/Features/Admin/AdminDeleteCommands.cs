using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Application.Features.Admin;

/// <summary>Soft delete template — ซ่อนจากทุก query แต่คูปองที่มอบไปแล้วยังอิง template_snapshot ของตัวเอง</summary>
public sealed record DeleteCouponTemplateCommand(int Id) : ICommand<Unit>;

public sealed class DeleteCouponTemplateCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteCouponTemplateCommand, Unit>
{
    public async Task<Unit> Handle(DeleteCouponTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = await db.CouponTemplates
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CouponTemplate), request.Id);

        template.IsDeleted = true;
        template.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

public sealed record DeleteCouponSetCommand(int Id) : ICommand<Unit>;

public sealed class DeleteCouponSetCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DeleteCouponSetCommand, Unit>
{
    public async Task<Unit> Handle(DeleteCouponSetCommand request, CancellationToken cancellationToken)
    {
        var set = await db.CouponSets
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CouponSet), request.Id);

        set.IsDeleted = true;
        set.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

/// <summary>
/// Soft delete user — บัญชีล็อกอินไม่ได้ทันที ยุติคู่ทั้งหมด และยกเลิกคำขอที่ค้างอยู่ (คืนสิทธิ์ที่กันไว้)
/// ประวัติการมอบ/ใช้คูปองคงเดิม
/// </summary>
public sealed record DeleteUserCommand(int Id) : ICommand<Unit>;

public sealed class DeleteUserCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IIdentityService identity)
    : IRequestHandler<DeleteUserCommand, Unit>
{
    public async Task<Unit> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        var adminId = currentUser.RequiredUserId();

        if (request.Id == adminId)
            throw new ConflictException("ไม่สามารถลบบัญชีตัวเองได้");

        var target = await identity.GetUserAsync(request.Id, cancellationToken);
        if (target.IsAdmin)
            throw new ConflictException("ไม่สามารถลบบัญชีผู้ดูแลระบบได้");

        await identity.SoftDeleteUserAsync(request.Id, cancellationToken);

        // ยุติคู่ทุกคู่ที่ user นี้เป็นสมาชิก
        var couples = await db.Couples
            .Include(c => c.Members)
            .Where(c => c.Status == CoupleStatus.Active && c.Members.Any(m => m.UserId == request.Id))
            .ToListAsync(cancellationToken);
        foreach (var couple in couples)
            couple.Status = CoupleStatus.Dissolved;

        // ยกเลิกคำขอที่ยัง PENDING และเกี่ยวข้องกับ user นี้ — คืนสิทธิ์ที่กันไว้ให้คู่อีกฝ่าย
        var pendingRedemptions = await db.Redemptions
            .Include(r => r.IssuedCoupon)
            .Where(r => r.Status == RedemptionStatus.Pending
                && (r.RequesterId == request.Id || r.IssuedCoupon!.SenderId == request.Id))
            .ToListAsync(cancellationToken);
        foreach (var redemption in pendingRedemptions)
        {
            redemption.IssuedCoupon!.TryReleaseReservation();
            redemption.Status = RedemptionStatus.Cancelled;
            redemption.ResolvedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
