import type { CouponEffect } from "@/types";

/** Labels for coupon powers. `pick` asks the receiver to choose the coupon the power works on. */
export const couponEffects = {
  NONE: { label: "คูปองปกติ", pick: "" },
  EXTEND: { label: "ต่อเวลา", pick: "เลือกคูปองที่อยากต่ออายุอีก 60 วัน" },
  FASTPASS: { label: "FAST PASS", pick: "เลือกคูปองที่อยากให้ทำภายใน 24 ชั่วโมง" },
  UPGRADE: { label: "UPGRADE", pick: "เลือกคูปองที่จะอัปเกรดครั้งนี้ แล้วเขียนในโน้ตว่าอยากได้ส่วนเพิ่มแบบไหน" },
  WILDCARD: { label: "WILDCARD", pick: "เลือกคูปองจากคลังที่อยากให้ใบนี้กลายเป็น" },
  REPLAY: { label: "REPLAY", pick: "เลือกคูปองที่เคยใช้แล้วและอยากได้อีกรอบ" },
  REPLAYGOLD: { label: "REPLAY GOLD", pick: "เลือกความทรงจำที่อยากให้เกิดขึ้นอีกครั้ง" },
} as const satisfies Record<CouponEffect, { label: string; pick: string }>;

export type MetaEffect = Exclude<CouponEffect, "NONE">;

/** Old responses and unknown values read as a normal coupon. */
export function metaEffect(effect?: string | null): MetaEffect | null {
  return effect && effect !== "NONE" && Object.hasOwn(couponEffects, effect) ? effect as MetaEffect : null;
}
