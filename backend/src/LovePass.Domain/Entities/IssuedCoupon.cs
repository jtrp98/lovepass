using System.ComponentModel.DataAnnotations.Schema;
using LovePass.Domain.Common;
using LovePass.Domain.Enums;
using LovePass.Domain.ValueObjects;

namespace LovePass.Domain.Entities;

public class IssuedCoupon : BaseEntity
{
    public int GiftBatchId { get; set; }
    public GiftBatch? GiftBatch { get; set; }
    public int CouponTemplateId { get; set; }
    public CouponTemplate? Template { get; set; }
    public int SenderId { get; set; }
    public ApplicationUser? Sender { get; set; }
    public int ReceiverId { get; set; }
    public ApplicationUser? Receiver { get; set; }
    public int Quantity { get; set; }
    public int RemainingQuantity { get; set; }
    public int ReservedQuantity { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string TemplateSnapshot { get; set; } = string.Empty;
    public IssuedCouponStatus Status { get; set; } = IssuedCouponStatus.Active;
    public uint RowVersion { get; set; }

    [NotMapped]
    public int AvailableQuantity => RemainingQuantity - ReservedQuantity;

    [NotMapped]
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;

    [NotMapped]
    public bool IsUsable => Status == IssuedCouponStatus.Active && !IsExpired && AvailableQuantity > 0;

    public CouponTemplateSnapshot ReadSnapshot() => CouponTemplateSnapshot.FromJson(TemplateSnapshot);

    public bool TryReserve()
    {
        if (!IsUsable) return false;
        ReservedQuantity++;
        return true;
    }

    public bool TryConfirmRedemption()
    {
        if (ReservedQuantity <= 0 || RemainingQuantity <= 0) return false;
        ReservedQuantity--;
        RemainingQuantity--;
        if (RemainingQuantity == 0) Status = IssuedCouponStatus.FullyRedeemed;
        return true;
    }

    public bool TryReleaseReservation()
    {
        if (ReservedQuantity <= 0) return false;
        ReservedQuantity--;
        return true;
    }
}
