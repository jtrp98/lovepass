import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href : "playwright");
const base = process.env.UI_TEST_URL || "http://localhost:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = process.env.UI_TEST_OUT || fileURLToPath(new URL("../test-results/", import.meta.url));
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
const checks = [], errors = [];
const pass = (name) => { checks.push(name); console.log("PASS", name); };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: "Asia/Bangkok" });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/design/love-pass");
  const gallery = page.locator(".category-icon-grid");
  await gallery.waitFor();
  assert.equal(await gallery.getByRole("link").count(), 9);
  assert.equal(await gallery.locator('use[href$="gift.svg#drawing"]').count(), 1);
  assert.equal(await gallery.locator('use[href$="power.svg#drawing"]').count(), 1);
  for (const drawing of await gallery.locator("svg").all()) {
    await drawing.evaluate((svg) => new Promise((resolve, reject) => {
      let attempts = 0;
      const timer = setInterval(() => {
        if (svg.getBBox().width > 0) { clearInterval(timer); resolve(); }
        else if (++attempts > 40) { clearInterval(timer); reject(new Error("SVG asset did not render")); }
      }, 50);
    }));
  }
  const source = await gallery.locator("use").first().getAttribute("href");
  const before = await gallery.locator("svg").first().evaluate((svg) => getComputedStyle(svg).color);
  await page.getByLabel("ลองเปลี่ยนระดับความพิเศษ").selectOption("COMMON");
  const after = await gallery.locator("svg").first().evaluate((svg) => getComputedStyle(svg).color);
  assert.notEqual(before, after);
  assert.equal(await gallery.locator("use").first().getAttribute("href"), source);
  assert.match(await page.locator(".pocket-ticket use").first().getAttribute("href"), /affection\.svg/);
  assert.match(await page.locator(".pocket-ticket use").nth(1).getAttribute("href"), /wish\.svg/);
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await gallery.screenshot({ path: path.join(output, "screenshots", "category-icons-mint.png") });
  await page.getByLabel("ลองเปลี่ยนระดับความพิเศษ").selectOption("EPIC");
  await gallery.screenshot({ path: path.join(output, "screenshots", "category-icons-plum.png") });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  pass("9 external SVG assets including GIFT/POWER render; category selects artwork, tier changes ink without changing the SVG; gallery reflows at 320/390/768/1440");
  await context.addInitScript(() => {
    localStorage.setItem("lovepass.accessToken", "fixture-access");
    localStorage.setItem("lovepass.refreshToken", "fixture-refresh");
  });
  let saved = null;
  await context.route("**/api/v1/**", async (route) => {
    const request = route.request(), url = new URL(request.url());
    const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    let body;
    if (url.pathname.endsWith("/auth/me")) body = { id: 1, displayName: "ผู้ทดสอบ", email: "test@example.invalid", isAdmin: true };
    else if (url.pathname.includes("/admin/coupon-templates")) {
      if (request.method() !== "GET") saved = { ...request.postDataJSON(), id: 1, createdAt: "2026-10-30", updatedAt: null };
      body = request.method() === "GET" ? (saved ? [saved] : []) : saved;
    } else body = null;
    return route.fulfill({ headers, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto(base + "/admin/coupons");
  await page.getByRole("button", { name: "+ สร้างต้นแบบคูปอง", exact: true }).click();
  await page.getByLabel("ชื่อคูปอง", { exact: true }).fill("ชื่อที่ไม่มีคำว่าดาวหรือพร");
  await page.getByLabel("หมวดหมู่คูปอง", { exact: true }).selectOption("WISH");
  await page.getByLabel("ประเภทความพิเศษ", { exact: true }).selectOption("LEGENDARY");
  assert.match(await page.locator(".category-icon-preview use").getAttribute("href"), /wish\.svg/);
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  await page.getByRole("button", { name: "แก้ไข", exact: true }).waitFor();
  assert.equal(saved.category, "WISH");
  assert.equal(saved.rarity, "LEGENDARY");
  await page.getByRole("button", { name: "แก้ไข", exact: true }).click();
  assert.equal(await page.getByLabel("หมวดหมู่คูปอง", { exact: true }).inputValue(), "WISH");
  await page.getByLabel("หมวดหมู่คูปอง", { exact: true }).selectOption("CARE");
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  await page.getByRole("button", { name: "แก้ไข", exact: true }).waitFor();
  assert.equal(saved.category, "CARE");
  assert.equal(saved.rarity, "LEGENDARY");
  pass("admin create/edit submits and restores category independently of tier and coupon name");
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, "category-verification.json"), JSON.stringify({ checks, consoleErrors: errors }, null, 2));
} finally { await browser.close(); }
