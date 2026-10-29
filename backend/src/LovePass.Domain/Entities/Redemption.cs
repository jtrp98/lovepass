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

    public bool IsPending => Status == RedemptionStatus.Pending;
}
