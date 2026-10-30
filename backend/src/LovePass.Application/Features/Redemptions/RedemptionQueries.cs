using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Enums;
using LovePass.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Application.Features.Redemptions;

/// <summary>direction: "sent" = คำขอที่ฉันส่ง, "received" = คำขอที่ฉันเป็นผู้มอบคูปองและต้องพิจารณา</summary>
public sealed record GetRedemptionsQuery(string Direction = "sent") : IQuery<List<RedemptionListDto>>;

public sealed record RedemptionListDto(
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

public sealed class GetRedemptionsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetRedemptionsQuery, List<RedemptionListDto>>
{
    public async Task<List<RedemptionListDto>> Handle(GetRedemptionsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();
        var received = request.Direction.Equals("received", StringComparison.OrdinalIgnoreCase);

        var query = db.Redemptions.AsNoTracking()
            .Include(r => r.IssuedCoupon)
            .Include(r => r.Requester)
            .Include(r => r.Approver)
            .AsQueryable();

        query = received
            ? query.Where(r => r.IssuedCoupon!.SenderId == userId)
            : query.Where(r => r.RequesterId == userId);

        var rows = await query
            .OrderByDescending(r => r.Status == RedemptionStatus.Pending)
            .ThenByDescending(r => r.RequestedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        return rows.Select(r =>
        {
            var s = r.IssuedCoupon!.ReadSnapshot();
            var target = r.TargetSnapshot is null ? null : CouponTemplateSnapshot.FromJson(r.TargetSnapshot);
            return new RedemptionListDto(
                r.Id,
                r.IssuedCouponId,
                s.Name,
                s.Rarity,
                s.Emoji,
                r.RequesterId,
                r.Requester?.DisplayName ?? $"User #{r.RequesterId}",
                r.ApproverId,
                r.Approver?.DisplayName,
                r.Message,
                r.Status.ToString().ToUpperInvariant(),
                r.RequestedAt,
                r.ResolvedAt,
                r.IssuedCoupon.ExpiresAt,
                s.Category,
                s.Effect,
                target?.Name,
                target?.Rarity,
                target?.Category);
        }).ToList();
    }
}
