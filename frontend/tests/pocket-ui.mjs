import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href : "playwright");
const base = process.env.UI_TEST_URL || "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = process.env.UI_TEST_OUT || fileURLToPath(new URL("../../docs/ui-implementation/", import.meta.url));
const evidence = { checks: [], screenshots: [], consoleErrors: [], contrast: [] };
const pass = (text) => { evidence.checks.push(text); console.log("PASS", text); };
fs.mkdirSync(path.join(output, "screenshots"), { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, locale: "th-TH", timezoneId: "Asia/Bangkok" });
const page = await context.newPage();
page.on("pageerror", (error) => evidence.consoleErrors.push(error.message));
async function shot(name) {
  await page.evaluate(() => document.fonts.ready);
  const devTools = await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.screenshot({ path: path.join(output, "screenshots", name + ".png"), fullPage: !/detail|confirm|stamped|receipt/.test(name), animations: "disabled" });
  await devTools.evaluate((element) => element.remove());
  evidence.screenshots.push(name + ".png");
}
async function reflow() { assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "page must not scroll sideways"); }
const openWish = () => page.getByRole("button", { name: "เปิดใช้สิทธิ์ ตั๋วขอพร 1 ข้อ", exact: true });
const dialog = () => page.getByRole("dialog");
try {
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.origin === new URL(base).origin || url.protocol === "data:" ? route.continue() : route.abort();
  });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base + "/design/love-pass");
    await openWish().waitFor();
    await reflow();
    assert.equal(await page.locator(".pocket-ticket").count(), 2);
    for (const action of await page.locator(".pocket-ticket button").all()) {
      const box = await action.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
    }
    assert.ok(await page.getByText("คูปองพร้อมใช้ 2 ใบ", { exact: true }).isVisible());
    await shot("pocket-available-" + width);
    if (width === 1440) {
      const cards = await page.locator(".pocket-collection").first().boundingBox();
      await page.screenshot({ path: path.join(output, "screenshots", "pocket-cards-1440.png"), clip: { x: cards.x - 12, y: cards.y - 12, width: cards.width + 24, height: cards.height + 24 }, animations: "disabled" });
      evidence.screenshots.push("pocket-cards-1440.png");
    }
    for (const [label, state] of [["ใช้แล้ว เก็บไว้", "used"], ["หมดอายุ", "expired"]]) {
      await page.getByRole("group", { name: "สถานะตั๋วตัวอย่าง" }).getByRole("button", { name: new RegExp(label) }).click();
      assert.equal(await page.locator(`.pocket-ticket[data-state="${state}"]`).count(), 2);
      if (state === "used") {
        assert.equal(await page.locator(".pocket-watermark[aria-hidden=true]").count(), 2);
        assert.equal(await page.locator(".pocket-watermark").first().evaluate((e) => getComputedStyle(e).pointerEvents), "none");
      }
      await reflow();
      if ([390, 1440].includes(width)) await shot(`pocket-${state}-${width}`);
      if (state === "used" && [390, 1440].includes(width)) {
        await page.locator(".pocket-ticket button").first().click();
        await dialog().getByRole("heading", { name: "ใบรับความทรงจำ" }).waitFor();
        assert.ok(await dialog().getByText("เลขที่ตั๋ว", { exact: true }).isVisible());
        assert.equal(await dialog().getByRole("textbox").count(), 0);
        await shot(`pocket-receipt-${width}`);
        await page.keyboard.press("Escape");
      }
    }
  }
  pass("two Thai coupons in available/used/expired states reflow at 320, 390, 768, 1024 and 1440; actions ≥44px");
  await page.getByRole("button", { name: "เริ่มลองใหม่" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await openWish().focus();
  await page.keyboard.press("Enter");
  await dialog().waitFor();
  await shot("pocket-detail-390");
  await page.keyboard.press("Shift+Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.includes("ขอใช้ใบนี้")), true);
  await dialog().getByRole("textbox").fill("เย็นนี้ไปเดินเล่นกันนะ");
  await dialog().getByRole("button", { name: "ขอใช้ใบนี้" }).click();
  await dialog().getByRole("heading", { name: "ส่งคำขอใช้ใบนี้นะ?" }).waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), "ส่งคำขอใช้ใบนี้นะ?");
  await page.keyboard.press("Shift+Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), "ยืนยันส่งคำขอ");
  await shot("pocket-confirm-390");
  await dialog().getByRole("button", { name: "กลับไปแก้" }).click();
  assert.equal(await dialog().getByRole("textbox").inputValue(), "เย็นนี้ไปเดินเล่นกันนะ");
  await dialog().getByRole("button", { name: "ขอใช้ใบนี้" }).click();
  await dialog().getByRole("button", { name: "ยืนยันส่งคำขอ" }).click();
  await dialog().getByText("ส่งคำขอตัวอย่างแล้ว ในแอปจริงต้องรออีกคนยืนยัน").waitFor();
  assert.equal(await page.locator(".pocket-ticket[data-state=used]").count(), 0);
  await dialog().getByRole("button", { name: "จำลองแฟนยืนยัน" }).click();
  await dialog().getByRole("heading", { name: "ใบรับความทรงจำ" }).waitFor();
  await shot("pocket-stamped-390");
  await dialog().getByRole("button", { name: "เก็บเข้าความทรงจำ" }).click();
  assert.equal(await page.locator(".pocket-ticket[data-state=used]").count(), 3);
  await page.getByRole("group", { name: "สถานะตั๋วตัวอย่าง" }).getByRole("button", { name: /^พร้อมใช้/ }).click();
  await page.getByText("คูปองพร้อมใช้ 1 ใบ", { exact: true }).first().waitFor();
  const wishCard = page.locator(".pocket-ticket").filter({ has: page.getByRole("heading", { name: "ตั๋วขอพร 1 ข้อ", exact: true }) });
  assert.ok(await wishCard.getByText("คูปองพร้อมใช้ 1 ใบ", { exact: true }).isVisible());
  pass("confirm/back preserves note; request waits for approval; only one of two wish sheets is consumed");
  await openWish().click();
  await page.keyboard.press("Escape");
  assert.equal(await openWish().evaluate((e) => e === document.activeElement), true);
  const card = page.locator(".pocket-ticket").first();
  await card.scrollIntoViewIfNeeded();
  const bounds = await card.boundingBox();
  await page.mouse.click(bounds.x + 24, bounds.y + 30);
  await dialog().waitFor();
  await page.keyboard.press("Escape");
  pass("whole-card tapping, Enter, Escape, focus trap and focus restoration work");
  await page.setViewportSize({ width: 320, height: 844 });
  const spacing = await page.addStyleTag({ content: "* { letter-spacing: .12em !important; word-spacing: .16em !important; line-height: 1.5 !important; } p { margin-bottom: 2em !important; }" });
  await reflow();
  await spacing.evaluate((e) => e.remove());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await card.hover();
  assert.equal(await card.evaluate((e) => getComputedStyle(e).transform), "none");
  assert.equal(await card.evaluate((e) => getComputedStyle(e).transitionDuration), "0s");
  await page.getByRole("group", { name: "สถานะตั๋วตัวอย่าง" }).getByRole("button", { name: /^ใช้แล้ว เก็บไว้/ }).click();
  await page.locator(".pocket-ticket button").first().click();
  assert.equal(await dialog().locator(".memory-receipt").evaluate((e) => getComputedStyle(e).animationName), "none");
  assert.equal(await dialog().evaluate((e) => getComputedStyle(e).scrollbarWidth), "none");
  await page.keyboard.press("Escape");
  pass("320px text-spacing overrides reflow; reduced motion disables lift and transitions");
  evidence.contrast = await page.evaluate(() => {
    const colors = [["#30473f", "#fff9f0"], ["#62675e", "#fff9f0"], ["#5a4077", "#fff9f0"], ["#30473f", "#dcefe5"], ["#5a4077", "#e9e1f7"], ["#a84458", "#fff9f0"], ["#686057", "#fff9f0"], ["#62675e", "#f5f2ea"]];
    const lum = (hex) => { const c = hex.match(/[a-f\d]{2}/gi).map((n) => parseInt(n, 16) / 255).map((n) => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4); return c[0] * .2126 + c[1] * .7152 + c[2] * .0722; };
    return colors.map(([fg, bg]) => { const [a, b] = [lum(fg), lum(bg)]; return { fg, bg, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) }; });
  });
  for (const pair of evidence.contrast) assert.ok(pair.ratio >= 4.5, JSON.stringify(pair));
  pass("8 paper/accent/state text color pairs exceed 4.5:1");

  // Exercise the actual product integration with deterministic API responses.
  await context.unroute("**/*");
  await context.addInitScript(() => { localStorage.setItem("lovepass.accessToken", "fixture-access"); localStorage.setItem("lovepass.refreshToken", "fixture-refresh"); });
  const coupon = { id: 10, name: "ตั๋วกอดไม่อั้น", description: "เหนื่อยเมื่อไหร่ ก็มากอดกันนะ ♡", terms: "กอดได้ไม่จำกัดครั้งภายในวันหมดอายุ", rarity: "COMMON", quantity: 2, remaining: 2, available: 2, expiresAt: "2027-11-29T16:59:59Z", expiringSoon: false, senderId: 2, emoji: null, imageUrl: null };
  let calls = 0, failRequest = false, submittedMessage;
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith("/api/v1/")) return url.origin === new URL(base).origin ? route.continue() : route.abort();
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    let body = null, status = 200;
    if (url.pathname.endsWith("/auth/me")) body = { id: 1, displayName: "ผู้ทดสอบ", isAdmin: false, email: "test@example.invalid" };
    else if (url.pathname.endsWith("/coupons/my")) body = [coupon];
    else if (url.pathname.endsWith("/coupon-templates")) body = [coupon];
    else if (url.pathname.endsWith("/redemptions") && route.request().method() === "POST") {
      calls++;
      submittedMessage = route.request().postDataJSON().message;
      if (failRequest) { status = 500; body = { title: "test error" }; }
      else { coupon.available--; body = { id: 42, status: "PENDING" }; }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return route.fulfill({ status, headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify(body) });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(base + "/my-coupons");
  const openHug = page.getByRole("button", { name: "เปิดใช้สิทธิ์ ตั๋วกอดไม่อั้น", exact: true });
  await openHug.click();
  await dialog().getByRole("textbox").fill("ขอกอดเย็นนี้นะ");
  await dialog().getByRole("button", { name: "ขอใช้ใบนี้" }).click();
  assert.equal(calls, 0);
  await dialog().getByRole("button", { name: "กลับไปแก้" }).click();
  assert.equal(calls, 0);
  await dialog().getByRole("button", { name: "ขอใช้ใบนี้" }).click();
  failRequest = true;
  await dialog().getByRole("button", { name: "ยืนยันส่งคำขอ" }).click();
  await dialog().getByRole("alert").waitFor();
  assert.equal(coupon.available, 2);
  assert.equal(await dialog().getByText("ขอกอดเย็นนี้นะ", { exact: true }).count(), 1);
  failRequest = false;
  await dialog().getByRole("button", { name: "ยืนยันส่งคำขอ" }).dblclick();
  await dialog().waitFor({ state: "hidden" });
  assert.equal(calls, 2, "one failed attempt and one successful attempt, never a duplicate");
  assert.equal(submittedMessage, "ขอกอดเย็นนี้นะ");
  assert.equal(coupon.available, 1);
  await page.getByText(/คูปองพร้อมใช้ 1 ใบ.*รอยืนยัน 1 ใบ/).waitFor();
  assert.equal(await page.locator(".pocket-watermark").count(), 0);
  await shot("pocket-product-320");
  pass("real request integration: no POST before confirmation, errors retain message/quantity, retry locks duplicate clicks, refresh shows reserved sheet without used stamp");
  coupon.available = 0;
  await page.reload();
  await page.getByRole("button", { name: "เปิดดูความทรงจำ ตั๋วกอดไม่อั้น" }).click();
  assert.equal(await dialog().getByRole("button", { name: "รอแฟนยืนยัน", exact: true }).isDisabled(), true);
  assert.equal(await dialog().getByRole("textbox").count(), 0);
  await page.keyboard.press("Escape");
  coupon.available = 2;
  coupon.expiresAt = "2020-01-01T00:00:00Z";
  await page.reload();
  await page.getByRole("button", { name: "เปิดดูความทรงจำ ตั๋วกอดไม่อั้น" }).click();
  assert.equal(await dialog().getByRole("button", { name: "หมดอายุแล้ว", exact: true }).isDisabled(), true);
  assert.equal(await dialog().getByRole("textbox").count(), 0);
  await page.keyboard.press("Escape");
  pass("pending and expired real coupon details cannot submit a new request");
  await page.goto(base + "/catalog");
  await page.getByRole("button", { name: "เปิดดูใบนี้ ตั๋วกอดไม่อั้น" }).click();
  await dialog().getByRole("button", { name: "เพิ่มลงของขวัญ" }).click();
  await dialog().getByRole("status").waitFor();
  const cart = await page.evaluate(() => Object.entries(localStorage).find(([key]) => /cart/i.test(key))?.[1]);
  assert.ok(cart?.includes('"quantity":1'));
  pass("catalog ticket detail preserves the gift cart action");
  assert.deepEqual(evidence.consoleErrors, []);
  fs.writeFileSync(path.join(output, "pocket-verification.json"), JSON.stringify(evidence, null, 2));
} finally { await browser.close(); }
