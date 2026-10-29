using LovePass.Domain.Common;

namespace LovePass.Domain.Entities;

public class CouponSetItem : BaseEntity
{
    public int SetId { get; set; }
    public CouponSet? Set { get; set; }
    public int CouponTemplateId { get; set; }
    public CouponTemplate? Template { get; set; }
    public int Quantity { get; set; }
}
