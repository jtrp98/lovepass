using LovePass.Domain.Common;

namespace LovePass.Domain.Entities;

public class GiftBatch : BaseEntity
{
    public int SenderId { get; set; }
    public ApplicationUser? Sender { get; set; }
    public int ReceiverId { get; set; }
    public ApplicationUser? Receiver { get; set; }
    public int CoupleId { get; set; }
    public Couple? Couple { get; set; }
    public string? Message { get; set; }

    public List<IssuedCoupon> Coupons { get; set; } = [];
}
