import type { MyCoupon } from "../types/index";

const destinations = new Set([
  "/dashboard",
  "/catalog",
  "/sets",
  "/my-coupons",
  "/gifts/new",
  "/requests",
  "/history",
  "/sent-gifts",
  "/more",
  "/couple",
  "/couple/accept",
  "/admin/dashboard",
  "/admin/coupons",
  "/admin/sets",
  "/admin/users",
  "/admin/overview",
]);

export function safeReturnTo(value: string | null, fallback = "/dashboard"): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value) ||
    /%5c|%0[ad]/i.test(value)
  )
    return fallback;
  const path = value.split(/[?#]/, 1)[0];
  if (!destinations.has(path)) return fallback;
  const url = new URL(value, "https://lovepass.invalid");
  return url.origin === "https://lovepass.invalid" && url.pathname === path ? value : fallback;
}

export function authDestination(fallback = "/dashboard"): string {
  return safeReturnTo(new URLSearchParams(window.location.search).get("returnTo"), fallback);
}

export function authLink(route: "/login" | "/register", destination: string): string {
  return `${route}?returnTo=${encodeURIComponent(safeReturnTo(destination))}`;
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function defaultExpiry(date = new Date()): string {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 3);
  return localDate(next);
}

export function expiryInstant(value: string, today = localDate()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < today) return null;
  const date = new Date(`${value}T23:59:59`);
  return Number.isFinite(date.getTime()) && localDate(date) === value ? date.toISOString() : null;
}

export function quantityBound(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.min(100, Math.trunc(value))) : 1;
}

// No snapshot ID is exposed: group only when every displayed snapshot field matches.
export function couponGroupKey(coupon: MyCoupon): string {
  return JSON.stringify([
    coupon.name,
    coupon.description,
    coupon.terms,
    coupon.rarity,
    coupon.emoji,
    coupon.imageUrl,
    coupon.category ?? "OTHER",
    coupon.expiresAt,
    coupon.senderId,
  ]);
}

export function invitationCode(value: string, origin: string): string | null {
  const input = value.trim();
  if (/^[a-f\d]{32}$/i.test(input)) return input;
  try {
    const url = new URL(input, origin);
    if (
      url.origin !== origin ||
      url.pathname !== "/couple/accept" ||
      url.hash ||
      url.searchParams.getAll("token").length !== 1
    )
      return null;
    const token = url.searchParams.get("token") ?? "";
    return /^[a-f\d]{32}$/i.test(token) ? token : null;
  } catch {
    return null;
  }
}
