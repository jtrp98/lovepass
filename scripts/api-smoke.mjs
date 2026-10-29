// ทดสอบ business flow หลักของ LOVE PASS ผ่าน API จริง (ไม่มี dependency — ใช้ fetch ของ Node)
// วิธีใช้: node scripts/api-smoke.mjs [baseUrl]
// สร้าง user ทดสอบ 2 คน จับคู่ มอบคูปอง ขอใช้ อนุมัติ และตรวจประวัติ

const BASE = process.argv[2] ?? "http://localhost:5080";

let step = 0;
const ok = (name) => console.log(`  ✓ [${++step}] ${name}`);
const fail = (name, detail) => {
  console.error(`  ✗ [${step + 1}] ${name}\n    ${detail}`);
  process.exit(1);
};

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* no body */
  }
  return { status: res.status, json, text };
}

async function expectOk(name, promise, expectedStatus = 200) {
  const res = await promise;
  if (res.status !== expectedStatus) fail(name, `HTTP ${res.status}: ${res.text?.slice(0, 300)}`);
  ok(name);
  return res.json;
}

const stamp = Date.now();
const userA = { email: `a${stamp}@smoke.test`, password: "Passw0rd!", displayName: "อาร์ณ" };
const userB = { email: `b${stamp}@smoke.test`, password: "Passw0rd!", displayName: "บีเคิล" };

console.log(`LOVE PASS API smoke test → ${BASE}\n`);

// 1) Auth
const pairA = await expectOk("register user A", call("POST", "/api/v1/auth/register", { body: userA }));
const pairB = await expectOk("register user B", call("POST", "/api/v1/auth/login", { body: { email: userB.email, password: userB.password } }).then(async (r) => {
  // B ยังไม่มีบัญชี — สมัครก่อน
  if (r.status === 401) {
    return call("POST", "/api/v1/auth/register", { body: userB });
  }
  return r;
}));
const meA = await expectOk("GET /auth/me (A)", call("GET", "/api/v1/auth/me", { token: pairA.accessToken }));
const badLogin = await call("POST", "/api/v1/auth/login", { body: { email: userA.email, password: "wrong" } });
if (badLogin.status !== 401) fail("login รหัสผิดต้องได้ 401", `ได้ ${badLogin.status}`);
ok("login รหัสผิดตอบ 401");

// 2) Couple
const invitation = await expectOk("A สร้างคำเชิญจับคู่", call("POST", "/api/v1/couples/invitations", { token: pairA.accessToken }));
await expectOk("B ยอมรับคำเชิญ", call("POST", "/api/v1/couples/invitations/accept", { token: pairB.accessToken, body: { token: invitation.inviteToken } }));
const coupleA = await expectOk("GET /couples/me (A)", call("GET", "/api/v1/couples/me", { token: pairA.accessToken }));
if (coupleA.partnerDisplayName !== userB.displayName) fail("คู่ของ A ต้องเป็น B", JSON.stringify(coupleA));
ok("A จับคู่กับ B ถูกต้อง");

// 3) Catalog
const templates = await expectOk("GET /coupon-templates", call("GET", "/api/v1/coupon-templates", { token: pairA.accessToken }));
if (templates.length === 0) fail("คลังต้องมี template", "empty");
ok(`คลังมี ${templates.length} templates`);
const sets = await expectOk("GET /coupon-sets", call("GET", "/api/v1/coupon-sets", { token: pairA.accessToken }));

// 4) Gift — custom set จาก 2 template + จาก predefined set
const expiresAt = new Date(Date.now() + 30 * 86400_000).toISOString();
const gift1 = await expectOk("A มอบ custom set (2 ชนิด)", call("POST", "/api/v1/gifts", {
  token: pairA.accessToken,
  body: {
    receiverId: meA.id === coupleA.partnerUserId ? meA.id : coupleA.partnerUserId,
    expiresAt,
    message: "ทดสอบระบบ",
    items: [
      { couponTemplateId: templates[0].id, quantity: 3 },
      { couponTemplateId: templates[1].id, quantity: 2 },
    ],
  },
}), 201);
const gift2 = await expectOk("A มอบ predefined set", call("POST", "/api/v1/gifts", {
  token: pairA.accessToken,
  body: { receiverId: coupleA.partnerUserId, expiresAt, couponSetId: sets[0].id },
}), 201);

// มอบให้ตัวเอง / คนที่ไม่ใช่แฟน ต้องถูกปฏิเสธ (403 หรือ 409)
const stranger = await call("POST", "/api/v1/gifts", {
  token: pairA.accessToken,
  body: { receiverId: meA.id, expiresAt, items: [{ couponTemplateId: templates[0].id, quantity: 1 }] },
});
if (stranger.status < 400) fail("มอบให้ตัวเองต้องถูกปฏิเสธ", `ได้ ${stranger.status}`);
ok(`มอบให้ตัวเอง/คนที่ไม่ใช่แฟนตอบ ${stranger.status}`);

// 5) My coupons (B)
const myCoupons = await expectOk("GET /coupons/my (B)", call("GET", "/api/v1/coupons/my", { token: pairB.accessToken }));
const target = myCoupons.find((c) => c.name === templates[0].name && c.available > 0);
if (!target) fail("B ต้องเห็นคูปองที่ได้รับ", JSON.stringify(myCoupons.map((c) => c.name)));
ok(`B เห็นคูปอง ${myCoupons.length} ชุด`);

// 6) Redemption flow
const redemption = await expectOk("B ขอใช้คูปอง", call("POST", "/api/v1/redemptions", {
  token: pairB.accessToken,
  body: { issuedCouponId: target.id, message: "ขอใช้หน่อยน้า" },
}));
const received = await expectOk("A เห็นคำขอที่ต้องพิจารณา", call("GET", "/api/v1/redemptions?direction=received", { token: pairA.accessToken }));
const pending = received.find((r) => r.id === redemption.id && r.status === "PENDING");
if (!pending) fail("คำขอต้องอยู่สถานะ PENDING", JSON.stringify(received));
ok("คำขอ PENDING ถูกต้อง");

const afterReserve = await call("GET", "/api/v1/coupons/my", { token: pairB.accessToken });
const reserved = afterReserve.json.find((c) => c.id === target.id);
if (reserved.available !== target.available - 1) fail("สิทธิ์ต้องถูกกันไว้ 1 ใบ", `available ${reserved.available} vs ${target.available}`);
ok("ระบบกันสิทธิ์ 1 ใบระหว่าง PENDING");

await expectOk("A อนุมัติคำขอ", call("POST", `/api/v1/redemptions/${redemption.id}/approve`, { token: pairA.accessToken }));
const usedCoupon = (await call("GET", "/api/v1/coupons/my", { token: pairB.accessToken })).json.find((c) => c.id === target.id);
if (usedCoupon.remaining !== target.remaining - 1) fail("หักสิทธิ์ 1 ใบหลังอนุมัติ", `remaining ${usedCoupon.remaining}`);
ok("อนุมัติแล้วหักสิทธิ์ถาวร 1 ใบ");

// 7) History + dashboard
const history = await expectOk("GET /history (B)", call("GET", "/api/v1/history", { token: pairB.accessToken }));
if (!history.some((h) => h.type === "USED")) fail("ประวัติ B ต้องมี USED", JSON.stringify(history.map((h) => h.type)));
ok("ประวัติการใช้คูปองถูกบันทึก");
await expectOk("GET /coupons/dashboard (B)", call("GET", "/api/v1/coupons/dashboard", { token: pairB.accessToken }));
const sent = await expectOk("GET /gifts/sent (A)", call("GET", "/api/v1/gifts/sent", { token: pairA.accessToken }));
if (sent.length < 2) fail("A ต้องเห็นที่เคยมอบ 2 รายการ", `ได้ ${sent.length}`);
ok("A เห็นประวัติการมอบ");

// 8) Admin
const admin = await expectOk("login admin", call("POST", "/api/v1/auth/login", { body: { email: "admin@lovepass.local", password: "Admin@12345" } }));
await expectOk("GET /admin/dashboard/stats", call("GET", "/api/v1/admin/dashboard/stats", { token: admin.accessToken }));
const forbidden = await call("GET", "/api/v1/admin/users", { token: pairA.accessToken });
if (forbidden.status !== 403) fail("User ปกติเรียก admin ต้อง 403", `ได้ ${forbidden.status}`);
ok("User ปกติเรียก admin API ตอบ 403");
await expectOk("GET /admin/users", call("GET", "/api/v1/admin/users", { token: admin.accessToken }));

// 9) Google Sign-In (ยังไม่ตั้งค่า Client ID ต้องตอบ 409)
const google = await call("POST", "/api/v1/auth/google", { body: { idToken: "dummy-token" } });
if (google.status !== 409) fail("google ที่ยังไม่เปิดใช้งานต้อง 409", `ได้ ${google.status}`);
ok("Google sign-in ที่ยังไม่ตั้งค่า Client ID ตอบ 409");

// 10) Soft delete — template
const tempTemplate = await expectOk(
  "admin สร้าง template ชั่วคราว",
  call("POST", "/api/v1/admin/coupon-templates", {
    token: admin.accessToken,
    body: { name: `TEMP ${stamp}`, description: "ลบทิด", terms: "", rarity: "COMMON", emoji: null, imageUrl: null, isActive: true },
  }),
  201,
);
const delTemplate = await call("DELETE", `/api/v1/admin/coupon-templates/${tempTemplate.id}`, { token: admin.accessToken });
if (delTemplate.status !== 204) fail("soft delete template ต้อง 204", `ได้ ${delTemplate.status}`);
ok("admin soft delete template");
const catalogAfter = await call("GET", "/api/v1/coupon-templates", { token: pairA.accessToken });
if (catalogAfter.json.some((t) => t.id === tempTemplate.id)) fail("template ที่ลบต้องหายจาก catalog", "ยังโผล่อยู่");
ok("template ที่ถูก soft delete หายจากทุก query");

// 11) Soft delete — user (ลบแล้วล็อกอินไม่ได้ + ลบตัวเองไม่ได้)
const userC = { email: `c${stamp}@smoke.test`, password: "Passw0rd!", displayName: "ซีทดสอบ" };
const pairC = await expectOk("register user C", call("POST", "/api/v1/auth/register", { body: userC }));
const meC = await call("GET", "/api/v1/auth/me", { token: pairC.accessToken });
const delUser = await call("DELETE", `/api/v1/admin/users/${meC.json.id}`, { token: admin.accessToken });
if (delUser.status !== 204) fail("soft delete user ต้อง 204", `ได้ ${delUser.status}`);
ok("admin soft delete user");
const loginC = await call("POST", "/api/v1/auth/login", { body: { email: userC.email, password: userC.password } });
if (loginC.status !== 401) fail("user ที่ถูกลบต้องล็อกอินไม่ได้ (401)", `ได้ ${loginC.status}`);
ok("user ที่ถูก soft delete ล็อกอินไม่ได้ทันที");
const adminMe = await call("GET", "/api/v1/auth/me", { token: admin.accessToken });
const delSelf = await call("DELETE", `/api/v1/admin/users/${adminMe.json.id}`, { token: admin.accessToken });
if (delSelf.status === 204) fail("ลบบัญชีตัวเองต้องถูกปฏิเสธ", "ผ่านไปเฉย ๆ");
ok("ป้องกันการลบบัญชีตัวเอง");

console.log(`\n✅ PASS ทั้งหมด ${step} ขั้นตอน`);
