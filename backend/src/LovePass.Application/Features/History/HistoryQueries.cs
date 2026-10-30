using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Enums;
using LovePass.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Application.Features.History;

/// <summary>Type: GIFT (มอบให้แฟน) | RECEIVED (ได้รับ) | USED (ใช้สำเร็จ) | EXPIRED (หมดอายุ) | REDEEMED_OUT (คูปองที่เรามอบถูกใช้)</summary>
public sealed record HistoryEntryDto(string Type, string Title, string? Detail, DateTime OccurredAt);

public sealed record GetHistoryQuery() : IQuery<List<HistoryEntryDto>>;

public sealed class GetHistoryQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetHistoryQuery, List<HistoryEntryDto>>
{
    public async Task<List<HistoryEntryDto>> Handle(GetHistoryQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();
        var now = DateTime.UtcNow;

        var entries = new List<HistoryEntryDto>();

        // เลิกกันแล้วไม่แสดงสิ่งที่เกี่ยวกับอีกฝ่าย (จับคู่ใหม่กับคนเดิมแล้วกลับมาเห็น)
        var partnerIds = await Coupons.GetMyCouponsQueryHandler.ActivePartnerIds(db, userId, cancellationToken);

        // ประวัติการมอบคูปอง (ฉันเป็นผู้มอบ)
        var gifts = await db.GiftBatches.AsNoTracking()
            .Include(b => b.Coupons)
            .Include(b => b.Receiver)
            .Where(b => b.SenderId == userId && partnerIds.Contains(b.ReceiverId))
            .OrderByDescending(b => b.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        foreach (var gift in gifts)
        {
            var pack = gift.PackPlan is null ? null : GiftPackPlan.FromJson(gift.PackPlan);
            var detail = pack is null ? string.Join(", ", gift.Coupons.Select(c => $"{c.ReadSnapshot().Name} ×{c.Quantity}"))
                : $"{pack.Name} · รับเข้ากระเป๋าแล้ว {pack.Draws.Count}/{pack.Total} ใบ";
            entries.Add(new HistoryEntryDto(
                "GIFT",
                $"มอบ{(pack is null ? "คูปอง" : "ซองคูปอง")}ให้ {gift.Receiver?.DisplayName ?? "แฟน"}",
                string.IsNullOrWhiteSpace(gift.Message) ? detail : $"{detail} — \"{gift.Message}\"",
                gift.CreatedAt));
        }

        // คำขอที่อนุมัติแล้ว (ฉันเป็นผู้ขอใช้)
        var used = await db.Redemptions.AsNoTracking()
            .Include(r => r.IssuedCoupon)
            .Include(r => r.Approver)
            .Where(r => r.RequesterId == userId && partnerIds.Contains(r.IssuedCoupon!.SenderId) && r.Status == RedemptionStatus.Approved)
            .OrderByDescending(r => r.ResolvedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        foreach (var redemption in used)
        {
            var name = redemption.IssuedCoupon!.ReadSnapshot().Name;
            entries.Add(new HistoryEntryDto(
                "USED",
                $"ใช้คูปอง {name}",
                $"อนุมัติโดย {redemption.Approver?.DisplayName ?? "แฟน"}",
                redemption.ResolvedAt ?? redemption.RequestedAt));
        }

        // คูปองที่หมดอายุ (ฉันเป็นผู้รับ)
        var expired = await db.IssuedCoupons.AsNoTracking()
            .Where(c => c.ReceiverId == userId && partnerIds.Contains(c.SenderId) && c.ExpiresAt <= now)
            .OrderByDescending(c => c.ExpiresAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        foreach (var coupon in expired)
        {
            entries.Add(new HistoryEntryDto(
                "EXPIRED",
                $"คูปอง {coupon.ReadSnapshot().Name} หมดอายุ",
                coupon.RemainingQuantity > 0 ? $"เหลือใช้ไม่ได้ {coupon.RemainingQuantity} ใบ" : null,
                coupon.ExpiresAt));
        }

        // คูปองที่ฉันมอบและถูกใช้ครบ / ถูกใช้ (สรุปเป็น batch)
        var redeemedOut = await db.Redemptions.AsNoTracking()
            .Include(r => r.IssuedCoupon)
            .Include(r => r.Requester)
            .Where(r => r.IssuedCoupon!.SenderId == userId && partnerIds.Contains(r.RequesterId) && r.Status == RedemptionStatus.Approved)
            .OrderByDescending(r => r.ResolvedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        foreach (var redemption in redeemedOut)
        {
            var name = redemption.IssuedCoupon!.ReadSnapshot().Name;
            entries.Add(new HistoryEntryDto(
                "REDEEMED_OUT",
                $"{redemption.Requester?.DisplayName ?? "แฟน"} ใช้คูปอง {name}",
                null,
                redemption.ResolvedAt ?? redemption.RequestedAt));
        }

        return [.. entries.OrderByDescending(e => e.OccurredAt).Take(300)];
    }
}
