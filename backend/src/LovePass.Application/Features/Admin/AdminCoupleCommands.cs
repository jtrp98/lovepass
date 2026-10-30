using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Exceptions;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using LovePass.Application.Common.Interfaces;

namespace LovePass.Application.Features.Admin;

public sealed record AdminCoupleMemberDto(int UserId, string DisplayName, string Email);

public sealed record AdminCoupleDto(int Id, string Status, DateTime CreatedAt, List<AdminCoupleMemberDto> Members);

public sealed record GetAdminCouplesQuery() : IQuery<List<AdminCoupleDto>>;

public sealed class GetAdminCouplesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminCouplesQuery, List<AdminCoupleDto>>
{
    public async Task<List<AdminCoupleDto>> Handle(GetAdminCouplesQuery request, CancellationToken cancellationToken)
    {
        var couples = await db.Couples.AsNoTracking()
            .Include(c => c.Members)
            .ThenInclude(m => m.User)
            .OrderBy(c => c.Status)
            .ThenByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return [.. couples.Select(c => new AdminCoupleDto(
            c.Id,
            c.Status.ToString().ToUpperInvariant(),
            c.CreatedAt,
            [.. c.Members.Select(m => new AdminCoupleMemberDto(m.UserId, m.User?.DisplayName ?? $"User #{m.UserId}", m.User?.Email ?? string.Empty))]))];
    }
}

/// <summary>
/// ยกเลิกคู่ — เปลี่ยนสถานะเป็น Dissolved เท่านั้น ไม่ลบข้อมูล คูปองที่มอบ ประวัติการขอใช้ และความทรงจำคงเดิม
/// คำขอที่ยังรออยู่ระหว่างคู่นี้ถูกยกเลิกและคืนสิทธิ์ที่กันไว้ ทั้งสองคนกลับไปจับคู่ใหม่ได้
/// </summary>
public sealed record DissolveCoupleCommand(int Id) : ICommand<Unit>;

public sealed class DissolveCoupleCommandHandler(IApplicationDbContext db)
    : IRequestHandler<DissolveCoupleCommand, Unit>
{
    public async Task<Unit> Handle(DissolveCoupleCommand request, CancellationToken cancellationToken)
    {
        var couple = await db.Couples
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Couple), request.Id);

        if (!couple.TryDissolve())
            throw new ConflictException("คู่นี้ยกเลิกไปแล้ว");

        var memberIds = couple.Members.Select(m => m.UserId).ToList();
        var pending = await db.Redemptions
            .Include(r => r.IssuedCoupon)
            .Where(r => r.Status == RedemptionStatus.Pending
                && memberIds.Contains(r.RequesterId)
                && memberIds.Contains(r.IssuedCoupon!.SenderId))
            .ToListAsync(cancellationToken);
        foreach (var redemption in pending)
        {
            redemption.IssuedCoupon!.TryReleaseReservation();
            redemption.Status = RedemptionStatus.Cancelled;
            redemption.ResolvedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
