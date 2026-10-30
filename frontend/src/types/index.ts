import type { CouponCategory } from "../lib/coupon-categories";

// ---------------- Auth ----------------

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface CurrentUser {
  id: number;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: string;
}

// ---------------- Couple ----------------

export interface CoupleInfo {
  coupleId: number;
  partnerUserId: number;
  partnerDisplayName: string;
  partnerEmail: string;
  coupledSince: string;
}

export interface InvitationResult {
  inviteToken: string;
  inviteLink: string;
  expiresAt: string;
}

// ---------------- Catalog ----------------

export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";

/** พลังพิเศษของคูปองที่มีผลกับคูปองอื่น — NONE คือคูปองปกติ */
export type CouponEffect = "NONE" | "EXTEND" | "FASTPASS" | "UPGRADE" | "WILDCARD" | "REPLAY" | "REPLAYGOLD";

/** เป้าหมายที่คูปองพลังพิเศษเลือกได้: คูปองที่ได้รับแล้ว หรือ template สำหรับ WILDCARD */
export interface MetaTarget {
  issuedCouponId: number | null;
  couponTemplateId: number | null;
  name: string;
  rarity: Rarity;
  category: CouponCategory;
  terms: string;
  expiresAt: string | null;
  usedCount: number;
}

export interface CouponTemplate {
  effect?: CouponEffect;
  category?: CouponCategory;
  id: number;
  name: string;
  description: string;
  terms: string;
  rarity: Rarity;
  emoji: string | null;
  imageUrl: string | null;
}

export interface CouponSetItem {
  couponTemplateId: number;
  name: string;
  emoji: string | null;
  rarity: Rarity;
  quantity: number;
}

export interface CouponSet {
  id: number;
  name: string;
  description: string;
  items: CouponSetItem[];
  totalCoupons: number;
}

export interface PackQuota { rarity: Rarity; quantity: number }
export interface PackDraw { requestId: string; couponTemplateId: number; rarity: Rarity; random: boolean }
export interface PackOption {
  couponTemplateId: number;
  limit: number;
  selected: number;
  coupon: Omit<CouponTemplate, "id">;
}
export interface GiftPack {
  id: number;
  name: string;
  mode: "FIXED" | "CHOICE";
  message: string | null;
  expiresAt: string;
  openedAt: string | null;
  openedTiers: Rarity[];
  isSender: boolean;
  total: number;
  quotas: PackQuota[];
  options: PackOption[];
  draws: PackDraw[];
}
export interface CreateGiftPackInput {
  requestId: string;
  receiverId: number;
  name: string;
  mode: GiftPack["mode"];
  expiresAt: string;
  message?: string;
  options: { couponTemplateId: number; limit: number }[];
  quotas: PackQuota[];
}

// ---------------- Gifts / Coupons ----------------

export interface GiftItemInput {
  couponTemplateId: number;
  quantity: number;
}

export interface GiftItem {
  couponTemplateId: number;
  name: string;
  emoji: string | null;
  rarity: Rarity;
  quantity: number;
}

export interface GiftResult {
  giftBatchId: number;
  totalCoupons: number;
  expiresAt: string;
  items: GiftItem[];
}

export interface MyCoupon {
  effect?: CouponEffect;
  category?: CouponCategory;
  id: number;
  name: string;
  description: string;
  terms: string;
  rarity: Rarity;
  emoji: string | null;
  imageUrl: string | null;
  quantity: number;
  remaining: number;
  available: number;
  expiresAt: string;
  expiringSoon: boolean;
  senderId: number;
}

export interface SentGiftCoupon {
  category?: CouponCategory;
  name: string;
  emoji: string | null;
  rarity: Rarity;
  quantity: number;
  remaining: number;
  expiresAt: string;
}

export interface SentGift {
  id: number;
  message: string | null;
  createdAt: string;
  coupons: SentGiftCoupon[];
}

export interface Dashboard {
  receivedCoupons: number;
  usedCoupons: number;
  expiringSoon: number;
  pendingRequests: number;
}

// ---------------- Redemptions ----------------

export type RedemptionStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Redemption {
  category?: CouponCategory;
  id: number;
  issuedCouponId: number;
  couponName: string;
  rarity: Rarity;
  emoji: string | null;
  requesterId: number;
  requesterName: string;
  approverId: number | null;
  approverName: string | null;
  message: string | null;
  status: RedemptionStatus;
  requestedAt: string;
  resolvedAt: string | null;
  couponExpiresAt: string;
  effect?: CouponEffect;
  /** คูปองที่คูปองพลังพิเศษใบนี้ใช้ด้วย */
  targetName?: string | null;
  targetRarity?: Rarity | null;
  targetCategory?: CouponCategory | null;
}

// ---------------- History ----------------

export type HistoryType = "GIFT" | "RECEIVED" | "USED" | "EXPIRED" | "REDEEMED_OUT";

export interface HistoryEntry {
  type: HistoryType;
  title: string;
  detail: string | null;
  occurredAt: string;
}

// ---------------- Admin ----------------

export interface AdminCouponTemplate {
  effect?: CouponEffect;
  metaLocked?: boolean;
  category?: CouponCategory;
  id: number;
  name: string;
  description: string;
  terms: string;
  rarity: Rarity;
  emoji: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminUser {
  id: number;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalCouples: number;
  totalTemplates: number;
  totalSets: number;
  totalGiftedCoupons: number;
  totalUsedCoupons: number;
  totalExpiredCoupons: number;
}

export interface AdminSetItem {
  couponTemplateId: number;
  templateName: string;
  quantity: number;
}

export interface AdminCouponSet {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  items: AdminSetItem[];
  createdAt: string;
  updatedAt: string | null;
}
