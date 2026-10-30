using LovePass.Domain.Common;
using LovePass.Domain.Enums;

namespace LovePass.Domain.Entities;

public class Couple : BaseEntity
{
    public CoupleStatus Status { get; set; } = CoupleStatus.Active;
    public List<CoupleMember> Members { get; set; } = [];

    /// <summary>ยกเลิกคู่ — แค่เปลี่ยนสถานะ ไม่ลบสมาชิกหรือประวัติใดๆ คืน true ถ้าเปลี่ยนจริง</summary>
    public bool TryDissolve()
    {
        if (Status == CoupleStatus.Dissolved) return false;
        Status = CoupleStatus.Dissolved;
        return true;
    }
}
