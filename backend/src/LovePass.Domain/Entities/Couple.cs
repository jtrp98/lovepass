using LovePass.Domain.Common;
using LovePass.Domain.Enums;

namespace LovePass.Domain.Entities;

public class Couple : BaseEntity
{
    public CoupleStatus Status { get; set; } = CoupleStatus.Active;
    public List<CoupleMember> Members { get; set; } = [];
}
