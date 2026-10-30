using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Interfaces;
using LovePass.Application.Common.Models;
using LovePass.Application.Features.Gifts;
using LovePass.Application.Features.Redemptions;
using LovePass.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Application.Features.Admin;

// ---------------- Users ----------------

public sealed record GetAdminUsersQuery() : IQuery<List<UserListItemDto>>;

public sealed class GetAdminUsersQueryHandler(IIdentityService identity)
    : IRequestHandler<GetAdminUsersQuery, List<UserListItemDto>>
{
    public async Task<List<UserListItemDto>> Handle(GetAdminUsersQuery request, CancellationToken cancellationToken)
        => [.. (await identity.GetUsersAsync(cancellationToken)).OrderBy(u => u.Id)];
}

// ---------------- Dashboard stats ----------------

public sealed record AdminStatsDto(
    int TotalUsers, int TotalCouples, int TotalTemplates, int TotalSets,
    int TotalGiftedCoupons, int TotalUsedCoupons, int TotalExpiredCoupons);

public sealed record GetAdminStatsQuery() : IQuery<AdminStatsDto>;

public sealed class GetAdminStatsQueryHandler(IApplicationDbContext db, IIdentityService identity)
    : IRequestHandler<GetAdminStatsQuery, AdminStatsDto>
{
    public async Task<AdminStatsDto> Handle(GetAdminStatsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var totalUsers = await identity.CountUsersAsync(cancellationToken);
        var totalCouples = await db.Couples.CountAsync(c => c.Status == CoupleStatus.Active, cancellationToken);
        var totalTemplates = await db.CouponTemplates.CountAsync(cancellationToken);
        var totalSets = await db.CouponSets.CountAsync(cancellationToken);

        var issued = await db.IssuedCoupons.AsNoTracking()
            .Select(c => new { c.Quantity, c.RemainingQuantity, c.ExpiresAt })
            .ToListAsync(cancellationToken);

        return new AdminStatsDto(
            totalUsers,
            totalCouples,
            totalTemplates,
            totalSets,
            issued.Sum(c => c.Quantity),
            issued.Sum(c => c.Quantity - c.RemainingQuantity),
            issued.Count(c => c.ExpiresAt <= now));
    }
}

// ---------------- รายการของทั้งระบบ ----------------

public sealed record GetAdminGiftsQuery() : IQuery<List<SentGiftDto>>;

public sealed class GetAdminGiftsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminGiftsQuery, List<SentGiftDto>>
{
    public async Task<List<SentGiftDto>> Handle(GetAdminGiftsQuery request, CancellationToken cancellationToken)
    {
        var batches = await db.GiftBatches.AsNoTracking()
            .Include(b => b.Coupons)
            .Include(b => b.Sender)
            .Include(b => b.Receiver)
            .OrderByDescending(b => b.CreatedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        return batches.Select(b => new SentGiftDto(
            b.Id,
            $"จาก {b.Sender?.DisplayName ?? "?"} → ถึง {b.Receiver?.DisplayName ?? "?"}{(string.IsNullOrWhiteSpace(b.Message) ? "" : $" — \"{b.Message}\"")}",
            b.CreatedAt,
            [.. b.Coupons.Select(c =>
            {
                var s = c.ReadSnapshot();
                return new SentGiftCouponDto(s.Name, s.Emoji, s.Rarity, c.Quantity, c.RemainingQuantity, c.ExpiresAt, s.Category);
            })])).ToList();
    }
}

public sealed record GetAdminRedemptionsQuery() : IQuery<List<RedemptionListDto>>;

public sealed class GetAdminRedemptionsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminRedemptionsQuery, List<RedemptionListDto>>
{
    public async Task<List<RedemptionListDto>> Handle(GetAdminRedemptionsQuery request, CancellationToken cancellationToken)
    {
        var rows = await db.Redemptions.AsNoTracking()
            .Include(r => r.IssuedCoupon)
            .Include(r => r.Requester)
            .Include(r => r.Approver)
            .OrderByDescending(r => r.RequestedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        return rows.Select(r =>
        {
            var s = r.IssuedCoupon!.ReadSnapshot();
            return new RedemptionListDto(
                r.Id, r.IssuedCouponId, s.Name, s.Rarity, s.Emoji,
                r.RequesterId, r.Requester?.DisplayName ?? $"User #{r.RequesterId}",
                r.ApproverId, r.Approver?.DisplayName, r.Message,
                r.Status.ToString().ToUpperInvariant(),
                r.RequestedAt, r.ResolvedAt, r.IssuedCoupon.ExpiresAt);
        }).ToList();
    }
}
