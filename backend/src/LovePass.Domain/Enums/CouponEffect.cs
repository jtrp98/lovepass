namespace LovePass.Domain.Enums;

/// <summary>พลังพิเศษของคูปองที่มีผลกับคูปองอื่น — None คือคูปองปกติ</summary>
public enum CouponEffect
{
    None,
    Extend,
    FastPass,
    Upgrade,
    Wildcard,
    Replay,
    ReplayGold
}
