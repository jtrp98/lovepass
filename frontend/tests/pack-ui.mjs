import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const BASE = process.env.UI_TEST_URL || "http://127.0.0.1:3010";
const API = process.env.PACK_API_URL || "http://127.0.0.1:5091";
for (const url of [BASE, API]) assert.ok(["127.0.0.1", "localhost"].includes(new URL(url).hostname), "Local test servers only");
assert.ok(process.env.PACK_API_URL, "Set PACK_API_URL to an isolated local database-backed API; this test creates disposable accounts and gifts");
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href : "playwright");
const OUT = fileURLToPath(new URL("../test-results/packs/", import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const evidence = { checks: [], screenshots: [], consoleErrors: [] };
const pass = name => { evidence.checks.push(name); console.log("PASS", name); };
async function call(token, method, endpoint, body) {
  const response = await fetch(API + "/api/v1" + endpoint, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}
async function ok(token, method, endpoint, body) {
  const result = await call(token, method, endpoint, body);
  assert.equal(result.status, 200, JSON.stringify({ endpoint, ...result }));
  return result.data;
}
const stamp = Date.now();
async function register(label) {
  const auth = await ok(null, "POST", "/auth/register", { email: `packs-${label}-${stamp}@test.invalid`, password: "PackTest123!", displayName: label === "a" ? "คนจัดซอง" : "คนพิเศษ" });
  return { token: auth.accessToken, user: await ok(auth.accessToken, "GET", "/auth/me") };
}
const sender = await register("a"); const receiver = await register("b"); const stranger = await register("c");
const invite = await ok(sender.token, "POST", "/couples/invitations");
await ok(receiver.token, "POST", "/couples/invitations/accept", { token: invite.inviteToken });
const templates = await ok(sender.token, "GET", "/coupon-templates");
const house = templates.find(t => t.name === "งานบ้านนี้เราทำ");
const hug = templates.find(t => t.name === "กอดไม่อั้น");
const gift = templates.find(t => t.name === "ของขวัญวันเกิดที่เธอเลือก");
const visit = templates.find(t => t.name === "ไปหาเธอในวันของเรา");
assert.ok(house && hug && gift && visit);
const sets = await ok(sender.token, "GET", "/coupon-sets");
assert.equal(sets.find(s => s.name === "วันเกิดนี้ มีเราให้ทั้งปี")?.totalCoupons, 22);
assert.ok(!sets.some(s => s.name === "Romantic Set"));
pass("migration creates birthday 22-card set and hides Romantic Set");
const expiresAt = new Date(Date.now() + 86400000 * 365).toISOString();
function payload(overrides = {}) {
  return { requestId: crypto.randomUUID(), receiverId: receiver.user.id, name: "ซองวันเกิดที่มีคำสัญญาเล็กใหญ่ให้เก็บไว้ใช้ด้วยกันทั้งปี", mode: "CHOICE", expiresAt, message: "ดีใจที่โลกนี้มีเธอ ปีนี้ขอให้มีวันพักและรอยยิ้มเยอะ ๆ นะ", options: [{ couponTemplateId: house.id, limit: 2 }, { couponTemplateId: hug.id, limit: 3 }, { couponTemplateId: gift.id, limit: 1 }], quotas: [{ rarity: "COMMON", quantity: 4 }, { rarity: "RARE", quantity: 1 }], ...overrides };
}
const body = payload();
const pack = await ok(sender.token, "POST", "/gift-packs", body);
assert.equal((await ok(sender.token, "POST", "/gift-packs", body)).id, pack.id);
assert.equal((await call(sender.token, "POST", "/gift-packs", { ...body, name: "เปลี่ยนข้อมูล" })).status, 409);
assert.equal((await call(stranger.token, "POST", `/gift-packs/${pack.id}/open`)).status, 403);
assert.equal((await call(sender.token, "POST", `/gift-packs/${pack.id}/open`)).status, 403);
assert.equal((await ok(receiver.token, "GET", "/gift-packs")).find(p => p.id === pack.id).options.length, 0);
assert.equal((await call(receiver.token, "POST", `/gift-packs/${pack.id}/draws`, { requestId: crypto.randomUUID(), rarity: "COMMON" })).status, 409);
assert.equal((await call(sender.token, "POST", "/gift-packs", payload({ quotas: [{ rarity: "COMMON", quantity: 99 }] }))).status, 409);
assert.equal((await call(sender.token, "POST", "/gift-packs", payload({ options: [null] }))).status, 400);
pass("ownership, hidden contents, no pre-open draw, quota capacity, null validation and create idempotency");

const concurrentBody = payload({ name: "ซองส่งครั้งเดียว" });
const creates = await Promise.all(Array.from({ length: 3 }, () => call(sender.token, "POST", "/gift-packs", concurrentBody)));
assert.ok(creates.every(c => [200, 409].includes(c.status)));
assert.equal(new Set(creates.filter(c => c.status === 200).map(c => c.data.id)).size, 1);
assert.equal((await ok(sender.token, "GET", "/gift-packs")).filter(p => p.name === concurrentBody.name).length, 1);
pass("concurrent duplicate send creates exactly one envelope");

let restoreTemplate;
if (process.env.PACK_TEST_ADMIN_PASSWORD) {
  const admin = await ok(null, "POST", "/auth/login", { email: "admin@packs.invalid", password: process.env.PACK_TEST_ADMIN_PASSWORD });
  const original = (await ok(admin.accessToken, "GET", "/admin/coupon-templates")).find(t => t.id === house.id);
  await ok(admin.accessToken, "PUT", `/admin/coupon-templates/${house.id}`, { ...original, terms: "เงื่อนไขใหม่หลังส่งซอง" });
  restoreTemplate = () => ok(admin.accessToken, "PUT", `/admin/coupon-templates/${house.id}`, original);
}

await ok(receiver.token, "POST", `/gift-packs/${pack.id}/open`);
assert.equal((await ok(receiver.token, "GET", "/gift-packs")).find(p => p.id === pack.id).options.length, 0);
assert.equal((await call(receiver.token, "POST", `/gift-packs/${pack.id}/draws`, { requestId: crypto.randomUUID(), rarity: "COMMON" })).status, 409);
await ok(receiver.token, "POST", `/gift-packs/${pack.id}/tiers/COMMON/open`);
assert.equal((await call(stranger.token, "POST", `/gift-packs/${pack.id}/tiers/RARE/open`)).status, 403);
const choice = { requestId: crypto.randomUUID(), rarity: "COMMON", couponTemplateId: house.id };
try {
  const first = await ok(receiver.token, "POST", `/gift-packs/${pack.id}/draws`, choice);
  assert.equal(first.options.find(o => o.couponTemplateId === house.id).coupon.terms, house.terms);
  assert.equal((await ok(receiver.token, "GET", "/coupons/my")).find(c => c.name === house.name).terms, house.terms);
  if (restoreTemplate) pass("template edited after sending: pool and issued coupon retain original snapshot terms");
} finally { if (restoreTemplate) await restoreTemplate(); }
assert.equal((await call(receiver.token, "POST", `/gift-packs/${pack.id}/draws`, { requestId: crypto.randomUUID(), rarity: "COMMON", expectedDrawCount: 0 })).status, 409);
assert.equal((await ok(receiver.token, "POST", `/gift-packs/${pack.id}/draws`, choice)).draws.length, 1);
assert.equal((await call(receiver.token, "POST", `/gift-packs/${pack.id}/draws`, { ...choice, couponTemplateId: hug.id })).status, 409);
await ok(receiver.token, "POST", `/gift-packs/${pack.id}/draws`, { ...choice, requestId: crypto.randomUUID() });
assert.equal((await call(receiver.token, "POST", `/gift-packs/${pack.id}/draws`, { ...choice, requestId: crypto.randomUUID() })).status, 409);
await ok(receiver.token, "POST", `/gift-packs/${pack.id}/draws`, { requestId: crypto.randomUUID(), rarity: "COMMON" });
const attempts = await Promise.all(Array.from({ length: 4 }, () => call(receiver.token, "POST", `/gift-packs/${pack.id}/draws`, { requestId: crypto.randomUUID(), rarity: "COMMON" })));
assert.equal(attempts.filter(a => a.status === 200).length, 1);
assert.ok(attempts.every(a => [200, 409].includes(a.status)));
const after = (await ok(receiver.token, "GET", "/gift-packs")).find(p => p.id === pack.id);
assert.equal(after.draws.length, 4);
assert.equal(after.options.find(o => o.couponTemplateId === house.id).selected, 2);
assert.equal((await ok(receiver.token, "GET", "/coupons/my")).reduce((n, c) => n + c.quantity, 0), 4);
pass("mixed choice/random, persistent results, replay, repeat caps and concurrent final draw issue exactly four coupons");

const fixed = await ok(sender.token, "POST", "/gift-packs", payload({ mode: "FIXED", quotas: [], options: [{ couponTemplateId: house.id, limit: 8 }] }));
const opening = await Promise.all(Array.from({ length: 3 }, () => call(receiver.token, "POST", `/gift-packs/${fixed.id}/open`)));
assert.ok(opening.every(o => [200, 409].includes(o.status)));
assert.equal((await ok(receiver.token, "POST", `/gift-packs/${fixed.id}/open`)).draws.length, 8);
assert.equal((await ok(receiver.token, "GET", "/coupons/my")).reduce((n, c) => n + c.quantity, 0), 12);
pass("fixed envelope repeated/concurrent opening issues its eight cards once");

const expiring = await ok(sender.token, "POST", "/gift-packs", payload({ expiresAt: new Date(Date.now() + 1000).toISOString() }));
await ok(receiver.token, "POST", `/gift-packs/${expiring.id}/open`);
await ok(receiver.token, "POST", `/gift-packs/${expiring.id}/tiers/COMMON/open`);
await new Promise(resolve => setTimeout(resolve, 1100));
assert.equal((await call(receiver.token, "POST", `/gift-packs/${expiring.id}/draws`, { requestId: crypto.randomUUID(), rarity: "COMMON" })).status, 409);
pass("expired envelope cannot consume further selection rights");

const batch = await ok(sender.token, "POST", "/gift-packs", payload({ name: "ทดสอบรับหลายใบพร้อมกัน", options: [{ couponTemplateId: house.id, limit: 2 }, { couponTemplateId: hug.id, limit: 4 }], quotas: [{ rarity: "COMMON", quantity: 5 }] }));
await ok(receiver.token, "POST", `/gift-packs/${batch.id}/open`);
await ok(receiver.token, "POST", `/gift-packs/${batch.id}/tiers/COMMON/open`);
assert.equal((await call(receiver.token, "POST", `/gift-packs/${batch.id}/draws`, { requestId: crypto.randomUUID(), rarity: "COMMON", quantity: 2, couponTemplateIds: [house.id, gift.id] })).status, 409);
assert.equal((await ok(receiver.token, "GET", "/gift-packs")).find(p => p.id === batch.id).draws.length, 0);
const randomBatch = { requestId: crypto.randomUUID(), rarity: "COMMON", quantity: 3, expectedDrawCount: 0 };
const randomBatchResult = await ok(receiver.token, "POST", `/gift-packs/${batch.id}/draws`, randomBatch);
assert.equal(randomBatchResult.draws.length, 3);
assert.equal((await ok(receiver.token, "POST", `/gift-packs/${batch.id}/draws`, randomBatch)).draws.length, 3);
assert.equal((await call(receiver.token, "POST", `/gift-packs/${batch.id}/draws`, { ...randomBatch, quantity: 2 })).status, 409);
const remainingIds = randomBatchResult.options.flatMap(o => Array(o.limit - o.selected).fill(o.couponTemplateId)).slice(0, 2);
const chosenBatch = { requestId: crypto.randomUUID(), rarity: "COMMON", quantity: 2, couponTemplateIds: remainingIds, expectedDrawCount: 3 };
assert.equal((await ok(receiver.token, "POST", `/gift-packs/${batch.id}/draws`, chosenBatch)).draws.length, 5);
assert.equal((await ok(receiver.token, "POST", `/gift-packs/${batch.id}/draws`, chosenBatch)).draws.length, 5);
pass("tier opening is separate from greeting card; multi-card random/choice batches are atomic and replay-safe");

const uiPack = await ok(sender.token, "POST", "/gift-packs", payload({ name: "ซองเปิดทดสอบสำหรับคนพิเศษ เก็บไว้ยิ้มด้วยกันทั้งปี", options: [{ couponTemplateId: house.id, limit: 8 }, { couponTemplateId: hug.id, limit: 8 }, { couponTemplateId: gift.id, limit: 1 }, { couponTemplateId: visit.id, limit: 10 }], quotas: [{ rarity: "COMMON", quantity: 8 }, { rarity: "RARE", quantity: 1 }, { rarity: "EPIC", quantity: 10 }] }));
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
const context = await browser.newContext({ locale: "th-TH", timezoneId: "Asia/Bangkok", viewport: { width: 390, height: 844 } });
let openFailure = true; let drawFailure = true; const observedIntents = [];
await context.route("**/api/v1/**", async route => {
  const request = route.request(); const endpoint = new URL(request.url()).pathname;
  if (endpoint.endsWith(`/${uiPack.id}/open`) && openFailure) { openFailure = false; return route.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ title: "ระบบพักสักครู่" }) }); }
  if (endpoint.endsWith(`/${uiPack.id}/draws`)) {
    observedIntents.push(request.postDataJSON().requestId);
    if (drawFailure) {
      drawFailure = false;
      // Commit on the real API but lose the response: retry must replay the same result.
      await route.fetch({ url: API + endpoint });
      return route.abort("failed");
    }
  }
  const response = await route.fetch({ url: API + endpoint + new URL(request.url()).search });
  await route.fulfill({ response });
});
await context.addInitScript(({ token }) => { localStorage.setItem("lovepass.accessToken", token); }, { token: receiver.token });
const page = await context.newPage(); page.on("pageerror", e => evidence.consoleErrors.push(e.message));
async function shot(name, fullPage = false) { await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: path.join(OUT, name + ".png"), fullPage, animations: "disabled" }); evidence.screenshots.push(name + ".png"); }
async function reflow() { assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow"); }
try {
  await page.goto(BASE + "/packs");
  let card = page.getByRole("region", { name: uiPack.name, exact: true });
  await card.waitFor(); await card.scrollIntoViewIfNeeded(); await reflow(); await shot("closed-390");
  await card.getByRole("button", { name: "เปิดการ์ดและดูของขวัญ" }).click();
  await card.getByRole("alert").waitFor();
  assert.equal(await card.locator(".envelope[data-closed]").count(), 1);
  await card.getByRole("button", { name: "เปิดการ์ดและดูของขวัญ" }).click();
  await card.getByRole("button", { name: "เปิดซอง COMMON", exact: true }).waitFor();
  assert.equal(await card.locator(".tier-envelope .envelope[data-closed]").count(), 3);
  const tierColors = await card.locator(".tier-envelope .envelope-front path:first-child").evaluateAll(elements => elements.map(el => getComputedStyle(el).fill));
  assert.equal(new Set(tierColors).size, 3);
  await card.scrollIntoViewIfNeeded();
  await card.locator(".tier-envelope-grid").screenshot({ path: path.join(OUT, "tier-gifts-390.png"), animations: "disabled" });
  evidence.screenshots.push("tier-gifts-390.png");
  await card.getByRole("button", { name: "เปิดซอง COMMON", exact: true }).click();
  await card.getByRole("button", { name: "สุ่ม COMMON ให้ฉัน 1 ใบ" }).waitFor();
  await card.getByRole("button", { name: "โหลดซองล่าสุด" }).count().then(async n => { if (n) await card.getByRole("button", { name: "โหลดซองล่าสุด" }).click(); });
  await card.scrollIntoViewIfNeeded(); await shot("opened-390");
  await card.getByLabel("สุ่มครั้งนี้กี่ใบ", { exact: true }).fill("2");
  await card.getByRole("button", { name: "สุ่ม COMMON ให้ฉัน 2 ใบ" }).click();
  await card.getByRole("button", { name: "ลองคำขอเดิมอีกครั้ง" }).waitFor();
  assert.equal(await card.locator(".pack-result").count(), 0);
  await card.getByRole("button", { name: "ลองคำขอเดิมอีกครั้ง" }).click();
  await card.locator(".pack-result").waitFor();
  assert.equal(observedIntents[0], observedIntents[1]);
  assert.equal((await ok(receiver.token, "GET", "/gift-packs")).find(p => p.id === uiPack.id).draws.length, 2);
  assert.equal(await card.locator(".pack-result h3").evaluate(el => el === document.activeElement), true);
  await shot("random-result-390"); await reflow();
  pass("live browser: failed open stays sealed; lost committed draw retries same intent and reveals once; focus moves to result");
  await page.reload();
  card = page.getByRole("region", { name: uiPack.name, exact: true });
  await card.getByRole("button", { name: "สุ่ม COMMON ให้ฉัน 1 ใบ" }).waitFor();
  assert.equal(await card.locator(".pack-result").count(), 0);
  assert.equal(await card.locator(".pack-cover .envelope[data-still]").count(), 1);
  await card.getByRole("button", { name: "เปิดดูใบนี้ งานบ้านนี้เราทำ", exact: true }).click();
  await card.getByLabel("จำนวน งานบ้านนี้เราทำ ที่จะเลือก", { exact: true }).fill("2");
  await card.getByRole("button", { name: "ใส่รายการ 2 ใบ", exact: true }).click();
  await card.getByRole("button", { name: "เปิดดูใบนี้ กอดไม่อั้น", exact: true }).click();
  await card.getByRole("button", { name: "ใส่รายการ 1 ใบ", exact: true }).click();
  await card.getByRole("button", { name: "รับที่เลือก 3 ใบ", exact: true }).focus();
  await page.keyboard.press("Enter");
  await card.getByRole("heading", { name: "คูปองที่เลือกเป็นของเธอแล้ว" }).waitFor();
  assert.equal((await ok(receiver.token, "GET", "/gift-packs")).find(p => p.id === uiPack.id).draws.length, 5);
  for (const width of [320, 390, 768, 1280, 1440]) { await page.setViewportSize({ width, height: 1000 }); await reflow(); }
  await page.setViewportSize({ width: 1280, height: 1000 }); await card.scrollIntoViewIfNeeded(); await shot("opened-1280");
  await card.locator(".tier-envelope-grid").screenshot({ path: path.join(OUT, "tier-gifts-1280.png"), animations: "disabled" });
  evidence.screenshots.push("tier-gifts-1280.png");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await card.locator(".pack-result-ticket").first().evaluate(el => getComputedStyle(el).animationName), "none");
  pass("keyboard choice, persistent reload without replay, reduced motion and 320–1440px reflow");
  await card.getByRole("button", { name: "เปิดซอง EPIC", exact: true }).click();
  await card.getByLabel("สุ่มครั้งนี้กี่ใบ", { exact: true }).fill("4");
  await card.getByRole("button", { name: "สุ่ม EPIC ให้ฉัน 4 ใบ", exact: true }).click();
  await card.getByRole("heading", { name: "โชคเลือกให้เธอแล้ว", exact: true }).waitFor();
  await card.getByRole("button", { name: `เปิดดูใบนี้ ${visit.name}`, exact: true }).click();
  await card.getByLabel(`จำนวน ${visit.name} ที่จะเลือก`, { exact: true }).fill("6");
  await card.getByRole("button", { name: "ใส่รายการ 6 ใบ", exact: true }).click();
  await card.getByRole("button", { name: "รับที่เลือก 6 ใบ", exact: true }).click();
  await card.getByRole("heading", { name: "คูปองที่เลือกเป็นของเธอแล้ว", exact: true }).waitFor();
  const epicResult = (await ok(receiver.token, "GET", "/gift-packs")).find(p => p.id === uiPack.id);
  assert.equal(epicResult.draws.filter(d => d.rarity === "EPIC").length, 10);
  assert.equal(epicResult.draws.filter(d => d.rarity === "COMMON").length, 5);
  await shot("epic-ten-1280");
  pass("EPIC ten-card envelope: random four then choose six, preserving other tier balances");

  // Sender journey exercises the real composer, review and create API.
  await context.addInitScript(({ token }) => { localStorage.setItem("lovepass.accessToken", token); }, { token: sender.token });
  await page.goto(BASE + "/packs/new");
  await page.getByRole("button", { name: "เริ่มจากชุดวันเกิด 22 ใบ" }).click();
  await page.getByRole("button", { name: "ดูเฉพาะที่เลือก (11)" }).click();
  await reflow(); await shot("birthday-composer-1280", true);
  await page.getByRole("button", { name: "ตรวจซองก่อนส่ง" }).click();
  await page.getByText("ตรวจการ์ด และของขวัญในชุด", { exact: true }).waitFor();
  await page.getByRole("button", { name: "ปิดผนึก ส่งให้แฟน" }).click();
  await page.getByText("ส่งซองให้แฟนแล้ว").waitFor();
  pass("birthday preset → review → sealed send creates a real 22-card envelope");
  await page.goto(BASE + "/packs/new");
  await page.getByRole("button", { name: "เลือกซองตาม tier" }).waitFor();
  await page.getByLabel("COMMON", { exact: true }).fill("3");
  await page.getByLabel("หาคูปอง", { exact: true }).fill("งานบ้านนี้เราทำ");
  await page.getByRole("button", { name: "เปิดดูใบนี้ งานบ้านนี้เราทำ", exact: true }).click();
  await page.getByLabel("เลือกซ้ำได้สูงสุด (ใบ)", { exact: true }).fill("8");
  await page.setViewportSize({ width: 390, height: 844 }); await reflow(); await shot("choice-composer-390", true);
  await page.getByRole("button", { name: "ตรวจซองก่อนส่ง" }).click();
  await page.getByRole("button", { name: "ปิดผนึก ส่งให้แฟน" }).click();
  await page.getByText("ส่งซองให้แฟนแล้ว").waitFor();
  pass("custom tier quota and eight-repeat housework option → review → real choice envelope");
  assert.deepEqual(evidence.consoleErrors, []);
} catch (error) {
  await shot("failure", true);
  fs.writeFileSync(path.join(OUT, "failure.html"), await page.content());
  throw error;
} finally {
  fs.writeFileSync(path.join(OUT, "evidence.json"), JSON.stringify(evidence, null, 2));
  await browser.close();
}
