using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using LovePass.Domain.ValueObjects;

namespace LovePass.Domain.Rules;

/// <summary>
/// กติกาคูปองพลังพิเศษ: ใช้กับคูปองจากผู้มอบคนเดียวกัน, ใช้กับคูปองพลังพิเศษด้วยกันไม่ได้,
/// คูปองที่ MetaLocked (เงิน ของขวัญ MYTHIC) ใช้ได้เฉพาะต่อเวลา และแต่ละพลังมีระดับสูงสุดของเป้าหมาย
/// ข้อความที่คืนเป็นภาษาไทยเพื่อแสดงถึงผู้ใช้ — null แปลว่าผ่าน
/// </summary>
public static class MetaCouponRules
{
    public static readonly TimeSpan ExtendBy = TimeSpan.FromDays(60);

    public static CouponEffect EffectOf(CouponTemplateSnapshot snapshot) =>
        Enum.TryParse<CouponEffect>(snapshot.Effect, ignoreCase: true, out var effect) ? effect : CouponEffect.None;

    /// <summary>พลังที่เลือกคูปองที่ได้รับมาแล้วเป็นเป้าหมาย (WILDCARD เลือก template แทน)</summary>
    public static bool TargetsIssuedCoupon(CouponEffect effect) =>
        effect is CouponEffect.Extend or CouponEffect.FastPass or CouponEffect.Upgrade or CouponEffect.Replay or CouponEffect.ReplayGold;

    /// <summary>พลังที่ต้องกันสิทธิ์คูปองเป้าหมายไว้ระหว่างรอยืนยัน</summary>
    public static bool ReservesTarget(CouponEffect effect) =>
        effect is CouponEffect.Extend or CouponEffect.FastPass or CouponEffect.Upgrade;

    public static Rarity MaxTargetRarity(CouponEffect effect) => effect switch
    {
        CouponEffect.Extend => Rarity.Mythic,
        CouponEffect.FastPass or CouponEffect.Wildcard => Rarity.Rare,
        CouponEffect.Upgrade or CouponEffect.Replay => Rarity.Epic,
        CouponEffect.ReplayGold => Rarity.Legendary,
        _ => throw new ArgumentOutOfRangeException(nameof(effect))
    };

    public static string? CheckCouponTarget(CouponEffect effect, IssuedCoupon meta, IssuedCoupon target)
    {
        if (!TargetsIssuedCoupon(effect)) return "คูปองนี้ไม่ได้ใช้กับคูปองที่มีอยู่";
        if (target.Id == meta.Id) return "เลือกคูปองใบอื่นที่ไม่ใช่ใบนี้นะ";
        if (target.SenderId != meta.SenderId || target.ReceiverId != meta.ReceiverId)
            return "ใช้ได้กับคูปองที่ได้จากแฟนคนเดียวกันเท่านั้น";

        var snapshot = target.ReadSnapshot();
        if (EffectOf(snapshot) != CouponEffect.None) return "ใช้พลังพิเศษกับคูปองพลังพิเศษด้วยกันไม่ได้";
        if (effect != CouponEffect.Extend && snapshot.MetaLocked) return "คูปองใบนี้ใช้ร่วมกับพลังพิเศษได้เฉพาะต่อเวลา";
        if (!Enum.TryParse<Rarity>(snapshot.Rarity, ignoreCase: true, out var rarity) || rarity > MaxTargetRarity(effect))
            return $"พลังนี้ใช้ได้กับคูปองระดับไม่เกิน {MaxTargetRarity(effect).ToString().ToUpperInvariant()}";

        if (effect is CouponEffect.Replay or CouponEffect.ReplayGold)
            return target.ConfirmedUses > 0 ? null : "เลือกได้เฉพาะคูปองที่เคยใช้สำเร็จแล้ว";

        return target.IsUsable ? null : "คูปองใบนี้หมดอายุ ใช้หมดแล้ว หรือมีคำขอค้างอยู่เต็มจำนวน";
    }

    public static string? CheckTemplateTarget(CouponEffect effect, CouponTemplate template)
    {
        if (effect != CouponEffect.Wildcard) return "คูปองนี้ไม่ได้ใช้เลือกคูปองจากคลัง";
        if (!template.IsActive || template.IsDeleted) return "คูปองแบบนี้ปิดใช้งานแล้ว เลือกแบบอื่นนะ";
        if (template.Effect != CouponEffect.None) return "เลือกคูปองพลังพิเศษไม่ได้";
        if (template.MetaLocked || template.Category == CouponCategory.Gift) return "เลือกคูปองหมวดของขวัญและเงินไม่ได้";
        if (template.Rarity > MaxTargetRarity(effect)) return "WILDCARD เลือกได้เฉพาะคูปองระดับ COMMON หรือ RARE";
        return null;
    }
}
