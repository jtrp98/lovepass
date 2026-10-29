using LovePass.Domain.Common;
using LovePass.Domain.Enums;

namespace LovePass.Domain.Entities;

public class CouponTemplate : BaseEntity, ISoftDeletable
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Terms { get; set; } = string.Empty;
    public Rarity Rarity { get; set; } = Rarity.Common;
    public string? ImageUrl { get; set; }
    public string? Emoji { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public List<CouponSetItem> SetItems { get; set; } = [];
    public List<IssuedCoupon> IssuedCoupons { get; set; } = [];
}
