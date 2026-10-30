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

    /// <summary>จำนวนครั้งที่ผู้มอบยืนยันการใช้แล้ว</summary>
    [NotMapped]
    public int ConfirmedUses => Quantity - RemainingQuantity;

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

    /// <summary>
    /// ต่ออายุ 1 ใบที่ถูกกันสิทธิ์ไว้ ถ้าแถวนี้มีใบเดียวจะเลื่อนวันหมดอายุในแถวเดิม
    /// ถ้ามีหลายใบจะแยกใบนั้นออกเป็นแถวใหม่ เพื่อไม่ให้ใบอื่นได้อายุเพิ่มไปด้วย
    /// </summary>
    public bool TryExtendReservedUnit(TimeSpan extension, out IssuedCoupon? split)
    {
        split = null;
        if (ReservedQuantity <= 0 || RemainingQuantity <= 0) return false;
        ReservedQuantity--;
        if (Quantity == 1)
        {
            ExpiresAt = ExpiresAt.Add(extension);
            return true;
        }

        Quantity--;
        RemainingQuantity--;
        if (RemainingQuantity == 0) Status = IssuedCouponStatus.FullyRedeemed;
        split = new IssuedCoupon
        {
            GiftBatchId = GiftBatchId,
            CouponTemplateId = CouponTemplateId,
            SenderId = SenderId,
            ReceiverId = ReceiverId,
            Quantity = 1,
            RemainingQuantity = 1,
            ExpiresAt = ExpiresAt.Add(extension),
            TemplateSnapshot = TemplateSnapshot
        };
        return true;
    }

    public bool TryReleaseReservation()
    {
        if (ReservedQuantity <= 0) return false;
        ReservedQuantity--;
        return true;
    }
}
