using LovePass.Domain.Common;

namespace LovePass.Domain.Entities;

public class CouponSet : BaseEntity, ISoftDeletable
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public List<CouponSetItem> Items { get; set; } = [];
}
