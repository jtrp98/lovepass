// Seed คู่รักตัวอย่างผ่าน API เดิม: node scripts/seed-demo.mjs
// ตั้ง DEMO_PASSWORD ก่อนรัน ใช้บัญชีเดิมและไม่มอบของขวัญซ้ำเมื่อรันใหม่
import assert from "node:assert/strict";

const BASE = process.argv[2] ?? "http://localhost:5080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(BASE).hostname), "Seed runs only against a local API");
const password = process.env.DEMO_PASSWORD;
assert.ok(password, "Set DEMO_PASSWORD before running the seed");
const users = [
  { email: "mint@demo.lovepass.test", displayName: "มิ้นท์" },
  { email: "phum@demo.lovepass.test", displayName: "ภูมิ" },
];

async function call(method, path, token, body, allowed = []) {
  const response = await fetch(`${BASE}/api/v1${path}`, {
    method,
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (allowed.includes(response.status)) return null;
  assert.ok(response.ok, `${method} ${path}: HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}

for (const user of users) {
  const credentials = { ...user, password };
  const session = await call("POST", "/auth/login", null, credentials, [401])
    ?? await call("POST", "/auth/register", null, credentials);
  user.token = session.accessToken;
  user.id = (await call("GET", "/auth/me", user.token)).id;
}

const [mint, phum] = users;
const couples = [];
for (const user of users) couples.push(await call("GET", "/couples/me", user.token));
if (!couples[0] && !couples[1]) {
  const invitation = await call("POST", "/couples/invitations", mint.token);
  await call("POST", "/couples/invitations/accept", phum.token, { token: invitation.inviteToken });
} else {
  assert.equal(couples[0]?.partnerUserId, phum.id, "Mint already has another partner");
  assert.equal(couples[1]?.partnerUserId, mint.id, "Phum already has another partner");
}

const templates = await call("GET", "/coupon-templates", mint.token);
assert.ok(templates.length, "Enable Seed__DemoTemplates and restart the API first");
const day = 86_400_000;
const now = Date.now();
for (const [sender, receiver] of [[phum, mint], [mint, phum]]) {
  const sent = await call("GET", "/gifts/sent", sender.token);
  for (const [label, days, selected] of [
    ["คูปองเติมความสุข", 30, templates],
    ["คูปองใกล้หมดอายุ", 3, templates.slice(0, 1)],
  ]) {
    const message = `[demo-seed] ${label} 💕`;
    if (sent.some((gift) => gift.message === message
      && gift.coupons.some((coupon) => new Date(coupon.expiresAt).getTime() > now))) continue;
    await call("POST", "/gifts", sender.token, {
      receiverId: receiver.id,
      expiresAt: new Date(now + days * day).toISOString(),
      message,
      items: selected.map((template) => ({ couponTemplateId: template.id, quantity: 2 })),
    });
  }

  let coupons = await call("GET", "/coupons/my", receiver.token);
  const requests = await call("GET", "/redemptions?direction=sent", receiver.token);
  const message = "[demo-seed] ขอใช้คูปองกับเธอวันนี้นะ 💌";
  if (!requests.some((request) => request.message === message)) {
    const target = coupons.find((coupon) => coupon.expiringSoon && coupon.available > 0);
    assert.ok(target, "Expected an expiring coupon to request");
    await call("POST", "/redemptions", receiver.token, { issuedCouponId: target.id, message });
  }

  // ตรวจข้อมูลจริงหลัง seed เพื่อให้หน้า UI มีทั้งใช้ได้ ใกล้หมดอายุ และรอยืนยัน
  coupons = await call("GET", "/coupons/my", receiver.token);
  assert.ok(coupons.some((coupon) => coupon.available > 0), "Missing usable coupons");
  assert.ok(coupons.some((coupon) => coupon.expiringSoon), "Missing expiring coupons");
  console.log(`${receiver.displayName} (${receiver.email}): ${coupons.length} coupon entries`);
}
const couple = await call("GET", "/couples/me", mint.token);
assert.equal(couple.partnerUserId, phum.id);
console.log("Demo couple ready. Open http://localhost:3000/my-coupons and log in with DEMO_PASSWORD.");
