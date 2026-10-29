export const couponCategories = {
  AFFECTION: { label: "กอดและความรัก", icon: "/illustrations/coupons/affection.svg" },
  TOGETHER: { label: "เวลาด้วยกัน", icon: "/illustrations/coupons/together.svg" },
  FOOD: { label: "มื้ออร่อย", icon: "/illustrations/coupons/food.svg" },
  CARE: { label: "ดูแลกัน", icon: "/illustrations/coupons/care.svg" },
  WISH: { label: "ขอพร", icon: "/illustrations/coupons/wish.svg" },
  ADVENTURE: { label: "เที่ยวด้วยกัน", icon: "/illustrations/coupons/adventure.svg" },
  OTHER: { label: "คำสัญญาอื่น ๆ", icon: "/illustrations/coupons/other.svg" },
} as const;

export type CouponCategory = keyof typeof couponCategories;

// Old snapshots and unknown future categories keep a safe, locally owned icon.
export function resolveCategory(category?: string | null): CouponCategory {
  return category && Object.hasOwn(couponCategories, category) ? category as CouponCategory : "OTHER";
}
