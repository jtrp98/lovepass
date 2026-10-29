using LovePass.Domain.Common;

namespace LovePass.Domain.Entities;

public class CoupleMember : BaseEntity
{
    public int CoupleId { get; set; }
    public Couple? Couple { get; set; }
    public int UserId { get; set; }
    public ApplicationUser? User { get; set; }
}
