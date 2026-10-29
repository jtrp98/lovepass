import { ApiError } from "../src/lib/api.ts";
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
