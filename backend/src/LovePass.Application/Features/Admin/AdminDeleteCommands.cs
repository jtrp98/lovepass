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
/// Soft delete user — บัญชีล็อกอินไม่ได้ทันที ลบได้เฉพาะผู้ใช้ที่ไม่เคยจับคู่กับใครเลย
/// (คนที่เคยจับคู่ ให้ยกเลิกคู่แทน เพื่อรักษาความทรงจำของอีกฝ่าย)
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

        // เคยจับคู่กับใครแล้ว (แม้ยกเลิกคู่ไปแล้ว) ลบไม่ได้ — ความทรงจำของอีกฝ่ายต้องอ้างถึงบัญชีนี้ได้เสมอ
        var everCoupled = await db.CoupleMembers.AnyAsync(m => m.UserId == request.Id, cancellationToken);
        if (everCoupled)
            throw new ConflictException("ไม่สามารถลบผู้ใช้ที่เคยจับคู่แล้วได้ เพราะเป็นส่วนหนึ่งของความทรงจำของอีกฝ่าย — ถ้าต้องการแยกกัน ให้ยกเลิกคู่แทน");

        await identity.SoftDeleteUserAsync(request.Id, cancellationToken);
        return Unit.Value;
    }
}
