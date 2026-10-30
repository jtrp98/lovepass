using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using LovePass.Domain.Rules;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Application.Features.Coupons;

public sealed record MyCouponDto(
    int Id,
    string Name,
    string Description,
    string Terms,
    string Rarity,
    string? Emoji,
    string? ImageUrl,
    int Quantity,
    int Remaining,
    int Available,
    DateTime ExpiresAt,
    bool ExpiringSoon,
    int SenderId,
    string Category = "OTHER",
    string Effect = "NONE");

public sealed record GetMyCouponsQuery(string? Rarity = null) : IQuery<List<MyCouponDto>>;

public sealed class GetMyCouponsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetMyCouponsQuery, List<MyCouponDto>>
{
    private static readonly TimeSpan ExpiringSoonWindow = TimeSpan.FromDays(7);

    public async Task<List<MyCouponDto>> Handle(GetMyCouponsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();
        var now = DateTime.UtcNow;

        var coupons = await db.IssuedCoupons.AsNoTracking()
            .Where(c => c.ReceiverId == userId
                && c.Status == IssuedCouponStatus.Active
                && c.ExpiresAt > now)
            .OrderBy(c => c.ExpiresAt) // FEFO — หมดอายุเร็วที่สุดมาก่อน
            .Take(500)
            .ToListAsync(cancellationToken);

        var result = coupons
            .Select(c => Map(c, now))
            .ToList();

        if (!string.IsNullOrWhiteSpace(request.Rarity))
            result = [.. result.Where(c => c.Rarity.Equals(request.Rarity, StringComparison.OrdinalIgnoreCase))];

        return result;
    }

    internal static MyCouponDto Map(IssuedCoupon c, DateTime now)
    {
        var s = c.ReadSnapshot();
        return new MyCouponDto(
            c.Id,
            s.Name,
            s.Description,
            s.Terms,
            s.Rarity,
            s.Emoji,
            s.ImageUrl,
            c.Quantity,
            c.RemainingQuantity,
            c.AvailableQuantity,
            c.ExpiresAt,
            c.ExpiresAt - now <= ExpiringSoonWindow,
            c.SenderId,
            s.Category,
            s.Effect);
    }
}

/// <summary>เป้าหมายที่คูปองพลังพิเศษใช้ได้ — IssuedCouponId สำหรับคูปองที่มีอยู่ หรือ CouponTemplateId สำหรับ WILDCARD</summary>
public sealed record MetaTargetDto(
    int? IssuedCouponId,
    int? CouponTemplateId,
    string Name,
    string Rarity,
    string Category,
    string Terms,
    DateTime? ExpiresAt,
    int UsedCount);

public sealed record GetMetaTargetsQuery(int IssuedCouponId) : IQuery<List<MetaTargetDto>>;

public sealed class GetMetaTargetsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetMetaTargetsQuery, List<MetaTargetDto>>
{
    public async Task<List<MetaTargetDto>> Handle(GetMetaTargetsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();
        var meta = await db.IssuedCoupons.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == request.IssuedCouponId, cancellationToken)
            ?? throw new NotFoundException(nameof(IssuedCoupon), request.IssuedCouponId);

        if (meta.ReceiverId != userId)
            throw new ForbiddenAccessException();

        var effect = MetaCouponRules.EffectOf(meta.ReadSnapshot());
        if (effect == CouponEffect.None)
            throw new ConflictException("คูปองนี้ไม่ใช่คูปองพลังพิเศษ");

        if (effect == CouponEffect.Wildcard)
        {
            // rarity เก็บเป็น string ใน DB จึงเทียบระดับในหน่วยความจำ ไม่เทียบใน SQL
            var templates = await db.CouponTemplates.AsNoTracking()
                .Where(t => t.IsActive && t.Effect == CouponEffect.None && !t.MetaLocked && t.Category != CouponCategory.Gift)
                .ToListAsync(cancellationToken);
            return [.. templates
                .Where(t => MetaCouponRules.CheckTemplateTarget(effect, t) is null)
                .OrderBy(t => t.Rarity).ThenBy(t => t.Name)
                .Select(t => new MetaTargetDto(null, t.Id, t.Name,
                t.Rarity.ToString().ToUpperInvariant(), t.Category.ToString().ToUpperInvariant(), t.Terms, null, 0))];
        }

        var candidates = await db.IssuedCoupons.AsNoTracking()
            .Where(c => c.SenderId == meta.SenderId && c.ReceiverId == userId && c.Id != meta.Id)
            .OrderBy(c => c.ExpiresAt)
            .Take(500)
            .ToListAsync(cancellationToken);

        var eligible = candidates.Where(c => MetaCouponRules.CheckCouponTarget(effect, meta, c) is null);
        // REPLAY: คูปองแบบเดียวกันหลายแถวรวมเป็นตัวเลือกเดียว ใช้แถวล่าสุดเป็นตัวแทน
        if (effect is CouponEffect.Replay or CouponEffect.ReplayGold)
            eligible = eligible.GroupBy(c => c.TemplateSnapshot).Select(g => g.OrderByDescending(c => c.Id).First());

        return [.. eligible.Select(c =>
        {
            var s = c.ReadSnapshot();
            return new MetaTargetDto(c.Id, null, s.Name, s.Rarity, s.Category, s.Terms, c.ExpiresAt, c.ConfirmedUses);
        })];
    }
}

public sealed record DashboardDto(int ReceivedCoupons, int UsedCoupons, int ExpiringSoon, int PendingRequests);

public sealed record GetDashboardQuery() : IQuery<DashboardDto>;

public sealed class GetDashboardQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    public async Task<DashboardDto> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();
        var now = DateTime.UtcNow;
        var soon = now.AddDays(7);

        var received = await db.IssuedCoupons.AsNoTracking()
            .Where(c => c.ReceiverId == userId && c.Status == IssuedCouponStatus.Active && c.ExpiresAt > now)
            .ToListAsync(cancellationToken);

        var used = await db.Redemptions.AsNoTracking()
            .CountAsync(r => r.RequesterId == userId && r.Status == RedemptionStatus.Approved, cancellationToken);

        var pending = await db.Redemptions.AsNoTracking()
            .CountAsync(r => r.Status == RedemptionStatus.Pending
                && (r.IssuedCoupon!.SenderId == userId || r.RequesterId == userId), cancellationToken);

        return new DashboardDto(
            received.Sum(c => c.AvailableQuantity),
            used,
            received.Count(c => c.ExpiresAt <= soon),
            pending);
    }
}
