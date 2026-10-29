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

export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export interface CouponTemplate {
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
