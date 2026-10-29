using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
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
    int SenderId);

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
            c.SenderId);
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
