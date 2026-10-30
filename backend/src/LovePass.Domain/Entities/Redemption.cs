using LovePass.Domain.Common;
using LovePass.Domain.Enums;

namespace LovePass.Domain.Entities;

public class Redemption : BaseEntity
{
    public int IssuedCouponId { get; set; }
    public IssuedCoupon? IssuedCoupon { get; set; }
    public int RequesterId { get; set; }
    public ApplicationUser? Requester { get; set; }
    public int? ApproverId { get; set; }
    public ApplicationUser? Approver { get; set; }
    public string? Message { get; set; }
    public RedemptionStatus Status { get; set; } = RedemptionStatus.Pending;
    public DateTime RequestedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }

    /// <summary>คูปองเป้าหมายของคูปองพลังพิเศษ (ต่อเวลา, FAST PASS, UPGRADE, REPLAY)</summary>
    public int? TargetIssuedCouponId { get; set; }
    public IssuedCoupon? TargetIssuedCoupon { get; set; }
    /// <summary>template ที่ WILDCARD เลือก</summary>
    public int? TargetTemplateId { get; set; }
    /// <summary>สำเนาเป้าหมาย ณ วันขอ เพื่อแสดงผลแม้ template ถูกแก้ภายหลัง</summary>
    public string? TargetSnapshot { get; set; }

    public bool IsPending => Status == RedemptionStatus.Pending;
}
