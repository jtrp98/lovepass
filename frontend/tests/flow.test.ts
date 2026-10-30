import { ApiError, api, tokenStore } from "../src/lib/api.ts";
import { couponCategories, resolveCategory } from "../src/lib/coupon-categories.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  safeReturnTo,
  authLink,
  localDate,
  defaultExpiry,
  expiryInstant,
  quantityBound,
  couponGroupKey,
  invitationCode,
} from "../src/lib/flow.ts";

test("returnTo preserves invite query and rejects origin escapes and unapproved routes", () => {
  assert.equal(safeReturnTo("/packs"), "/packs");
  assert.equal(safeReturnTo("/packs/new"), "/packs/new");
  const destination = "/couple/accept?token=ABCD&from=partner";
  assert.equal(safeReturnTo(destination), destination);
  assert.equal(
    new URL(authLink("/register", destination), "https://test.invalid").searchParams.get("returnTo"),
    destination,
  );
  for (const value of [
    null,
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%2f%2fevil.test",
    "/%252f%252fevil.test",
    "/catalog/../../evil",
    "/catalog%3f//evil",
    "/login",
    "/unknown",
    "/catalog?x=%5Cevil",
    "/catalog\n",
    " /catalog",
  ]) {
    assert.equal(safeReturnTo(value), "/dashboard", String(value));
  }
});

test("local calendar and expiry boundaries hold in Bangkok and negative UTC offsets", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "Asia/Bangkok";
    assert.equal(localDate(new Date("2026-10-29T17:01:00Z")), "2026-10-30");
    assert.equal(defaultExpiry(new Date("2026-10-29T17:01:00Z")), "2027-01-30");
    assert.equal(expiryInstant("2026-10-30", "2026-10-30"), "2026-10-30T16:59:59.000Z");
    process.env.TZ = "America/Los_Angeles";
    assert.equal(localDate(new Date("2026-10-30T02:00:00Z")), "2026-10-29");
    assert.equal(expiryInstant("2026-10-30", "2026-10-30"), "2026-10-31T06:59:59.000Z");
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
  assert.equal(expiryInstant("2026-02-30", "2026-01-01"), null);
  assert.equal(expiryInstant("2026-10-29", "2026-10-30"), null);
  assert.equal(expiryInstant("oops"), null);
});

test("quantity cannot exceed backend bounds", () => {
  for (const [input, expected] of [
    [-1, 1],
    [0, 1],
    [1, 1],
    [100, 100],
    [101, 100],
    [2.5, 2],
    [NaN, 1],
    [Infinity, 1],
  ])
    assert.equal(quantityBound(input), expected);
});

test("snapshot grouping never merges different terms, rarity or sender", () => {
  const coupon = {
    id: 1,
    name: "กอด",
    description: "กอดอุ่น",
    terms: "เมื่อว่าง",
    rarity: "COMMON" as const,
    emoji: "🤗",
    imageUrl: null,
    quantity: 1,
    remaining: 1,
    available: 1,
    expiresAt: "2027-01-01T00:00:00Z",
    expiringSoon: false,
    senderId: 2,
  };
  assert.equal(couponGroupKey(coupon), couponGroupKey({ ...coupon, id: 2, available: 0 }));
  for (const patch of [
    { terms: "เงื่อนไขใหม่" },
    { rarity: "RARE" as const },
    { category: "WISH" as const },
    { senderId: 3 },
    { description: "ใหม่" },
    { expiresAt: "2027-01-02T00:00:00Z" },
  ])
    assert.notEqual(couponGroupKey(coupon), couponGroupKey({ ...coupon, ...patch }));
});

test("categories use local reusable SVGs and safely handle legacy or unknown values", () => {
  for (const [key, category] of Object.entries(couponCategories)) {
    assert.equal(resolveCategory(key), key);
    const svg = readFileSync(new URL("../public" + category.icon, import.meta.url), "utf8");
    assert.match(svg, /id="drawing"/);
    assert.match(svg, /viewBox="0 0 120 110"/);
    assert.doesNotMatch(svg.replace("http://www.w3.org/2000/svg", ""), /<script|\bon\w+=|https?:\/\//i);
  }
  for (const value of [undefined, null, "", "__proto__", "UNKNOWN", "https://outside.invalid/icon.svg"])
    assert.equal(resolveCategory(value), "OTHER");
});

test("catalog category filter safely matches categories and resolves legacy values", () => {
  const templates = [
    { id: 1, name: "กอด", category: "AFFECTION" as const, rarity: "COMMON" as const },
    { id: 2, name: "มื้อค่ำ", category: "FOOD" as const, rarity: "RARE" as const },
    { id: 3, name: "ไม่มีหมวด", category: undefined, rarity: "COMMON" as const },
  ];
  const filterBy = (cat: string, rarity: string) =>
    templates.filter(
      (t) =>
        (rarity === "ALL" || t.rarity === rarity) &&
        (cat === "ALL" || resolveCategory(t.category) === cat),
    );
  assert.equal(filterBy("ALL", "ALL").length, 3);
  assert.equal(filterBy("FOOD", "ALL").length, 1);
  assert.equal(filterBy("FOOD", "ALL")[0].id, 2);
  assert.equal(filterBy("OTHER", "ALL").length, 1);
  assert.equal(filterBy("OTHER", "ALL")[0].id, 3);
  assert.equal(filterBy("FOOD", "COMMON").length, 0);
  assert.equal(filterBy("FOOD", "RARE").length, 1);
});

test("invitation parsing accepts only existing contract and trusted app links", () => {
  const token = "A".repeat(32),
    origin = "https://love.test";
  assert.equal(invitationCode(token, origin), token);
  assert.equal(invitationCode(`${origin}/couple/accept?token=${token}`, origin), token);
  for (const input of [
    `https://evil.test/couple/accept?token=${token}`,
    `//evil.test/couple/accept?token=${token}`,
    `/other?token=${token}`,
    `/couple/accept?token=${token}&token=${token}`,
    "abc",
  ])
    assert.equal(invitationCode(input, origin), null);
});

test("user errors stay Thai and never expose a missing invitation identifier", () => {
  assert.equal(
    new ApiError(404, "CoupleInvitation (private-code) was not found").displayMessage.includes(
      "private-code",
    ),
    false,
  );
  assert.equal(new ApiError(503, "internal trace").displayMessage, "ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้ง");
  const error = new ApiError(400, "Validation", {
    Email: ["Invalid email"],
    Password: ["รหัสผ่านสั้นเกินไป"],
  });
  assert.equal(error.fieldMessages.password[0], "รหัสผ่านสั้นเกินไป");
  assert.match(error.fieldMessages.email[0], /ข้อมูลในช่องนี้/);
});

test("rejected login never refreshes or expires an existing session; protected requests still do", async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const values = new Map<string, string>();
  let expired = 0;
  const calls: string[] = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
    dispatchEvent: () => { expired++; },
  } });
  try {
    tokenStore.set("old-access", "old-refresh");
    globalThis.fetch = async (input, init) => {
      calls.push(String(input));
      assert.equal(new Headers(init?.headers).has("Authorization"), false);
      return Response.json({ title: "Unauthorized." }, { status: 401 });
    };
    await assert.rejects(api.auth.login("admin@example.invalid", "wrong"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 401);
      assert.equal(error.sessionExpired, false);
      assert.match(error.displayMessage, /อีเมลหรือรหัสผ่านไม่ถูกต้อง/);
      return true;
    });
    assert.equal(calls.length, 1);
    assert.equal(expired, 0);
    assert.equal(tokenStore.access, "old-access");
    assert.equal(tokenStore.refresh, "old-refresh");

    globalThis.fetch = async (input, init) => {
      calls.push(String(input));
      if (!String(input).endsWith("/refresh"))
        assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer old-access");
      return Response.json({ title: "Unauthorized." }, { status: 401 });
    };
    await assert.rejects(api.auth.me(), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.sessionExpired, true);
      assert.match(error.displayMessage, /เซสชันหมดอายุ/);
      return true;
    });
    assert.equal(calls.length, 3);
    assert.ok(calls[2].endsWith("/api/v1/auth/refresh"));
    assert.equal(expired, 1);
    assert.equal(tokenStore.access, null);
    assert.equal(tokenStore.refresh, null);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
