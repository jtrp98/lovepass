import type {
  GiftPack,
  CreateGiftPackInput,
  Rarity,
  AdminCouponSet,
  AdminCouponTemplate,
  AdminStats,
  AdminUser,
  CouponSet,
  CouponTemplate,
  CoupleInfo,
  CurrentUser,
  Dashboard,
  GiftItemInput,
  GiftResult,
  HistoryEntry,
  InvitationResult,
  MetaTarget,
  MyCoupon,
  Redemption,
  SentGift,
  TokenPair,
} from "@/types";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5080").replace(/\/$/, "");

const ACCESS_KEY = "lovepass.accessToken";
const REFRESH_KEY = "lovepass.refreshToken";

export const tokenStore = {
  get access(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    window.localStorage.setItem(ACCESS_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: Record<string, string[]>;

  constructor(status: number, title: string, errors?: Record<string, string[]>) {
    super(title);
    this.status = status;
    this.errors = errors;
  }

  get fieldMessages(): Record<string, string[]> {
    return Object.fromEntries(
      Object.entries(this.errors ?? {}).map(([key, messages]) => [
        key.toLowerCase(),
        messages.map((message) =>
          /[\u0E00-\u0E7F]/.test(message) ? message : "ข้อมูลในช่องนี้ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        ),
      ]),
    );
  }

  get displayMessage(): string {
    if (this.status === 401) return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง";
    if (this.status === 403) return "คุณไม่มีสิทธิ์ดำเนินการกับรายการนี้";
    if (this.status === 404) return "ไม่พบรายการนี้ อาจถูกลบหรือใช้ไม่ได้แล้ว";
    if (this.status >= 500) return "ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้ง";
    const first = this.errors ? Object.values(this.errors)[0]?.[0] : undefined;
    const message = first ?? this.message;
    if (/[\u0E00-\u0E7F]/.test(message)) return message;
    return this.status === 400 || this.status === 422
      ? "กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง"
      : "ดำเนินการไม่สำเร็จ กรุณาโหลดรายการแล้วลองอีกครั้ง";
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return false;

  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          tokenStore.clear();
          return false;
        }
        throw await toApiError(res);
      }
      const pair = (await res.json()) as TokenPair;
      tokenStore.set(pair.accessToken, pair.refreshToken);
      return true;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const body = await res.json();
    return new ApiError(res.status, body.title ?? `Request failed (${res.status})`, body.errors);
  } catch {
    return new ApiError(res.status, `Request failed (${res.status})`);
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const doFetch = () => {
    const headers: Record<string, string> = {};
    if (init?.body) headers["Content-Type"] = "application/json";
    const token = tokenStore.access;
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE}${path}`, { ...init, headers });
  };

  let res = await doFetch();

  if (res.status === 401 && (await tryRefresh())) {
    res = await doFetch();
  }

  if (res.status === 401) {
    tokenStore.clear();
    window.dispatchEvent(new Event("lovepass:session-expired"));
  }
  if (!res.ok) throw await toApiError(res);
  // 204 (เช่น Ok(null) ของ .NET) หมายถึง "ไม่มีข้อมูล" — คืน null ไม่ใช่ undefined
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

const get = <T>(path: string) => apiFetch<T>(path);
const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
const put = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) });

// ---------------- typed endpoints ----------------

export const api = {
  packs: {
    list: () => get<GiftPack[]>("/api/v1/gift-packs"),
    create: (input: CreateGiftPackInput) => post<GiftPack>("/api/v1/gift-packs", input),
    open: (id: number) => post<GiftPack>(`/api/v1/gift-packs/${id}/open`),
    openTier: (id: number, rarity: Rarity) => post<GiftPack>(`/api/v1/gift-packs/${id}/tiers/${rarity}/open`),
    draw: (id: number, input: { requestId: string; rarity: Rarity; couponTemplateId?: number; couponTemplateIds?: number[]; quantity: number; expectedDrawCount: number }) =>
      post<GiftPack>(`/api/v1/gift-packs/${id}/draws`, input),
  },
  auth: {
    async login(email: string, password: string): Promise<TokenPair> {
      const pair = await post<TokenPair>("/api/v1/auth/login", { email, password });
      tokenStore.set(pair.accessToken, pair.refreshToken);
      return pair;
    },
    async register(email: string, password: string, displayName: string): Promise<TokenPair> {
      const pair = await post<TokenPair>("/api/v1/auth/register", { email, password, displayName });
      tokenStore.set(pair.accessToken, pair.refreshToken);
      return pair;
    },
    me: () => get<CurrentUser>("/api/v1/auth/me"),
    forgotPassword: (email: string) => post<void>("/api/v1/auth/forgot-password", { email }),
    resetPassword: (email: string, token: string, newPassword: string) =>
      post<void>("/api/v1/auth/reset-password", { email, token, newPassword }),
    async google(idToken: string): Promise<TokenPair> {
      const pair = await post<TokenPair>("/api/v1/auth/google", { idToken });
      tokenStore.set(pair.accessToken, pair.refreshToken);
      return pair;
    },
  },

  couples: {
    me: () => get<CoupleInfo | null>("/api/v1/couples/me"),
    createInvitation: () => post<InvitationResult>("/api/v1/couples/invitations"),
    acceptInvitation: (token: string) => post<CoupleInfo>("/api/v1/couples/invitations/accept", { token }),
  },

  catalog: {
    templates: (rarity?: string) =>
      get<CouponTemplate[]>(`/api/v1/coupon-templates${rarity ? `?rarity=${rarity}` : ""}`),
    sets: () => get<CouponSet[]>("/api/v1/coupon-sets"),
  },

  gifts: {
    createCustom: (input: {
      receiverId: number;
      expiresAt: string;
      message?: string;
      items: GiftItemInput[];
    }) => post<GiftResult>("/api/v1/gifts", { ...input, couponSetId: null }),
    createFromSet: (input: {
      receiverId: number;
      expiresAt: string;
      message?: string;
      couponSetId: number;
    }) => post<GiftResult>("/api/v1/gifts", { ...input, items: [] }),
    sent: () => get<SentGift[]>("/api/v1/gifts/sent"),
  },

  coupons: {
    my: (rarity?: string) => get<MyCoupon[]>(`/api/v1/coupons/my${rarity ? `?rarity=${rarity}` : ""}`),
    dashboard: () => get<Dashboard>("/api/v1/coupons/dashboard"),
    metaTargets: (issuedCouponId: number) => get<MetaTarget[]>(`/api/v1/coupons/${issuedCouponId}/meta-targets`),
  },

  redemptions: {
    request: (issuedCouponId: number, message?: string, target?: { targetIssuedCouponId?: number; targetTemplateId?: number }) =>
      post<Redemption>("/api/v1/redemptions", { issuedCouponId, message, ...target }),
    list: (direction: "sent" | "received") => get<Redemption[]>(`/api/v1/redemptions?direction=${direction}`),
    approve: (id: number) => post<Redemption>(`/api/v1/redemptions/${id}/approve`),
    reject: (id: number) => post<Redemption>(`/api/v1/redemptions/${id}/reject`),
    cancel: (id: number) => post<Redemption>(`/api/v1/redemptions/${id}/cancel`),
  },

  history: {
    list: () => get<HistoryEntry[]>("/api/v1/history"),
  },

  admin: {
    templates: () => get<AdminCouponTemplate[]>("/api/v1/admin/coupon-templates"),
    createTemplate: (body: Omit<AdminCouponTemplate, "id" | "createdAt" | "updatedAt">) =>
      post<AdminCouponTemplate>("/api/v1/admin/coupon-templates", body),
    updateTemplate: (id: number, body: Omit<AdminCouponTemplate, "id" | "createdAt" | "updatedAt">) =>
      put<AdminCouponTemplate>(`/api/v1/admin/coupon-templates/${id}`, { ...body, id }),
    deleteTemplate: (id: number) =>
      apiFetch<void>(`/api/v1/admin/coupon-templates/${id}`, { method: "DELETE" }),
    sets: () => get<AdminCouponSet[]>("/api/v1/admin/coupon-sets"),
    createSet: (body: { name: string; description: string; items: GiftItemInput[] }) =>
      post<AdminCouponSet>("/api/v1/admin/coupon-sets", body),
    updateSet: (
      id: number,
      body: { name: string; description: string; items: GiftItemInput[]; isActive: boolean },
    ) => put<AdminCouponSet>(`/api/v1/admin/coupon-sets/${id}`, { ...body, id }),
    deleteSet: (id: number) => apiFetch<void>(`/api/v1/admin/coupon-sets/${id}`, { method: "DELETE" }),
    users: () => get<AdminUser[]>("/api/v1/admin/users"),
    deleteUser: (id: number) => apiFetch<void>(`/api/v1/admin/users/${id}`, { method: "DELETE" }),
    stats: () => get<AdminStats>("/api/v1/admin/dashboard/stats"),
    gifts: () => get<SentGift[]>("/api/v1/admin/gifts"),
    redemptions: () => get<Redemption[]>("/api/v1/admin/redemptions"),
  },
};

// ---------------- gift cart (เลือกคูปองจาก catalog ก่อนไปหน้ามอบ) ----------------

export interface CartItem extends GiftItemInput {
  name: string;
  emoji: string | null;
  rarity: string;
}

const CART_KEY = "lovepass.giftCart";

export const giftCart = {
  read(): CartItem[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]") as CartItem[];
    } catch {
      return [];
    }
  },
  write(items: CartItem[]) {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  },
  clear() {
    window.localStorage.removeItem(CART_KEY);
  },
};
