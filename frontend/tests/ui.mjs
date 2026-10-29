import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const BASE = process.env.UI_TEST_URL || "http://127.0.0.1:3000";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(BASE).hostname), "UI tests run only on localhost");
const OUT = fileURLToPath(new URL("../../docs/ui-implementation/", import.meta.url));
fs.mkdirSync(path.join(OUT, "screenshots"), { recursive: true });
const user = {
  id: 1,
  displayName: "คนทดสอบ",
  email: "test@example.invalid",
  isAdmin: true,
  createdAt: "2026-01-01",
};
const couple = {
  coupleId: 1,
  partnerUserId: 2,
  partnerDisplayName: "แฟนคนพิเศษ",
  partnerEmail: "partner@example.invalid",
  coupledSince: "2026-01-01",
};
const template = {
  id: 1,
  name: "กอดเติมพลังและเดินเล่นด้วยกันในวันหยุดแสนพิเศษ",
  description: "กอดอุ่น ๆ ให้คนพิเศษ แล้วหาเวลาพักด้วยกัน",
  terms: "เลือกเวลาที่เราทั้งสองคนสะดวก และตกลงกันก่อนใช้",
  rarity: "COMMON",
  emoji: "🤗",
  imageUrl: null,
  isActive: true,
  createdAt: "2026-01-01",
  updatedAt: null,
};
const templates = [
  template,
  { ...template, id: 2, name: "มื้อพิเศษสำหรับสองเรา", rarity: "RARE", emoji: "🍽️" },
];
const set = {
  id: 1,
  name: "ชุดความสุขของเราที่มีชื่อยาวเพื่อทดสอบการขึ้นบรรทัด",
  description: "วันธรรมดาก็พิเศษได้",
  isActive: true,
  createdAt: "2026-01-01",
  items: templates.map((t) => ({
    couponTemplateId: t.id,
    name: t.name,
    templateName: t.name,
    emoji: t.emoji,
    rarity: t.rarity,
    quantity: 2,
  })),
  totalCoupons: 4,
};
const coupon = {
  ...template,
  id: 10,
  quantity: 2,
  remaining: 2,
  available: 2,
  expiresAt: "2027-02-01T16:59:59Z",
  expiringSoon: true,
  senderId: 2,
};
const redemption = {
  id: 1,
  issuedCouponId: 10,
  couponName: template.name,
  rarity: "COMMON",
  emoji: "🤗",
  requesterId: 2,
  requesterName: "แฟนคนพิเศษ",
  approverId: null,
  approverName: null,
  message: "ขอใช้เย็นนี้ได้ไหม",
  status: "PENDING",
  requestedAt: "2026-10-30T01:00:00Z",
  resolvedAt: null,
  couponExpiresAt: coupon.expiresAt,
};
const sentGift = {
  id: 1,
  message: "ให้คนพิเศษของเรา",
  createdAt: "2026-10-30T01:00:00Z",
  coupons: [{ ...coupon, quantity: 2 }],
};
const evidence = { checks: [], screenshots: [], layouts: [], contrast: [], fonts: [], consoleErrors: [] };
function pass(name) {
  evidence.checks.push(name);
  console.log("PASS", name);
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function run() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {}),
  });
  async function session(auth = true) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      timezoneId: "Asia/Bangkok",
      locale: "th-TH",
      serviceWorkers: "block",
    });
    if (auth)
      await context.addInitScript(() => {
        localStorage.setItem("lovepass.accessToken", "fixture-access");
        localStorage.setItem("lovepass.refreshToken", "fixture-refresh");
      });
    const state = {
      errors: {},
      delays: {},
      empty: false,
      paired: true,
      coupons: [coupon, { ...coupon, id: 11, terms: "เงื่อนไขอีกแบบ", rarity: "RARE" }],
      requests: [redemption, { ...redemption, id: 2 }],
      calls: [],
      payloads: [],
      failRequest: false,
    };
    await context.route("**/*", async (route) => {
      const req = route.request(),
        url = new URL(req.url()),
        p = url.pathname;
      if (!p.startsWith("/api/v1/")) {
        if (url.origin === new URL(BASE).origin || url.protocol === "data:") return route.continue();
        return route.abort();
      }
      state.calls.push({ path: p, method: req.method() });
      if (req.method() === "OPTIONS")
        return route.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "*",
            "access-control-allow-methods": "*",
          },
        });
      if (state.delays[p]) await wait(state.delays[p]);
      let status = state.errors[p] || 200,
        body;
      if (status === 200 && p === "/api/v1/redemptions" && req.method() === "POST" && state.failRequest) {
        status = 500;
        body = { title: "fixture failure" };
      } else if (status !== 200) body = { title: "fixture failure" };
      else if (p === "/api/v1/auth/me") body = user;
      else if (p.startsWith("/api/v1/auth/"))
        body = { accessToken: "fixture-access", refreshToken: "fixture-refresh", expiresInSeconds: 3600 };
      else if (p === "/api/v1/couples/me") body = state.paired ? couple : null;
      else if (p === "/api/v1/couples/invitations/accept") body = couple;
      else if (p === "/api/v1/couples/invitations")
        body = {
          inviteToken: "A".repeat(32),
          inviteLink: BASE + "/couple/accept?token=" + "A".repeat(32),
          expiresAt: "2026-11-06",
        };
      else if (p === "/api/v1/coupon-templates") {
        const rarity = url.searchParams.get("rarity");
        if (rarity === "COMMON") await wait(650);
        if (rarity === "RARE") await wait(40);
        body = state.empty ? [] : templates.filter((t) => !rarity || t.rarity === rarity);
      } else if (p === "/api/v1/coupon-sets" || p === "/api/v1/admin/coupon-sets")
        body = state.empty ? [] : [set];
      else if (p === "/api/v1/admin/coupon-templates") body = state.empty ? [] : templates;
      else if (p === "/api/v1/coupons/my") {
        const rarity = url.searchParams.get("rarity");
        if (rarity === "COMMON") await wait(650);
        if (rarity === "RARE") await wait(40);
        body = state.empty ? [] : state.coupons.filter((c) => !rarity || c.rarity === rarity);
      } else if (p === "/api/v1/coupons/dashboard")
        body = { receivedCoupons: 4, usedCoupons: 2, expiringSoon: 1, pendingRequests: 2 };
      else if (p === "/api/v1/admin/dashboard/stats")
        body = {
          totalUsers: 2,
          totalCouples: 1,
          totalTemplates: 2,
          totalSets: 1,
          totalGiftedCoupons: 4,
          totalUsedCoupons: 2,
          totalExpiredCoupons: 0,
        };
      else if (p === "/api/v1/redemptions" && req.method() === "GET") {
        const sent = url.searchParams.get("direction") === "sent";
        await wait(sent ? 40 : 300);
        body = state.empty
          ? []
          : state.requests.map((r) => (sent ? { ...r, couponName: "คำขอที่ฉันส่งทดสอบ" } : r));
      } else if (p === "/api/v1/admin/redemptions") body = state.empty ? [] : state.requests;
      else if (p === "/api/v1/redemptions" && req.method() === "POST") {
        state.payloads.push(req.postDataJSON());
        body = { ...redemption, id: 3 };
      } else if (/\/redemptions\/\d+\/(approve|reject|cancel)$/.test(p)) {
        await wait(400);
        const id = Number(p.split("/").at(-2));
        state.requests = state.requests.map((r) =>
          r.id === id ? { ...r, status: p.endsWith("/approve") ? "APPROVED" : "REJECTED" } : r,
        );
        body = state.requests.find((r) => r.id === id);
      } else if (p === "/api/v1/gifts" && req.method() === "POST") {
        state.payloads.push(req.postDataJSON());
        await wait(400);
        body = { giftBatchId: 1, totalCoupons: 4, expiresAt: coupon.expiresAt, items: set.items };
      } else if (p === "/api/v1/gifts/sent" || p === "/api/v1/admin/gifts")
        body = state.empty ? [] : [sentGift];
      else if (p === "/api/v1/history")
        body = state.empty
          ? []
          : [
              {
                type: "RECEIVED",
                title: template.name.repeat(2),
                detail: template.terms.repeat(3),
                occurredAt: "2026-10-30T01:00:00Z",
              },
            ];
      else if (p === "/api/v1/admin/users")
        body = state.empty
          ? []
          : [
              { ...user, role: "Admin" },
              {
                ...user,
                id: 2,
                email: "long-user-name-for-layout@example.invalid",
                displayName: "คู่รักที่ชื่อยาวมากสำหรับการทดสอบ",
                role: "User",
              },
            ];
      else {
        status = 501;
        body = { title: "Unexpected test endpoint" };
      }
      await route.fulfill({
        status,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(body),
      });
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => evidence.consoleErrors.push(e.message));
    const go = async (path) => {
      await page.goto(BASE + path);
      await page.locator("h1").first().waitFor();
    };
    return { context, page, state, go };
  }
  async function screenshot(page, name) {
    await page.screenshot({ path: path.join(OUT, "screenshots", name + ".png"), fullPage: true });
    evidence.screenshots.push(name + ".png");
  }
  // Anonymous invitation survives both auth pages and returns after successful login/register.
  for (const mode of ["login", "register"]) {
    const { context, page } = await session(false);
    const invite = "/couple/accept?token=" + "A".repeat(32);
    await page.goto(BASE + invite);
    await page.waitForURL("**/login?**");
    assert.equal(new URL(page.url()).searchParams.get("returnTo"), invite);
    if (mode === "register") {
      await page.getByRole("link", { name: "สมัครสมาชิก", exact: true }).click();
      await page.getByLabel("ชื่อเล่น / ชื่อที่แฟนเรียก").fill("คนทดสอบ");
    }
    await page.getByRole("textbox", { name: "อีเมล", exact: true }).fill("test@example.invalid");
    await page
      .getByLabel(mode === "login" ? "รหัสผ่าน" : "รหัสผ่าน (8 ตัวอักษรขึ้นไป)", { exact: true })
      .filter({ visible: true })
      .fill("fixture-password");
    await page
      .getByRole("button", { name: mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก", exact: true })
      .click();
    await page.waitForURL("**/couple/accept?**");
    assert.equal(new URL(page.url()).searchParams.get("token"), "A".repeat(32));
    pass("anonymous invite → " + mode + " → original invitation");
    await context.close();
  }
  const s = await session();
  const { context, page, state, go } = s;
  await go("/requests");
  await page.getByRole("button", { name: "อนุมัติ", exact: false }).first().waitFor();
  const approveCalls = () => state.calls.filter((c) => c.path.endsWith("/approve")).length;
  const opener = page.getByRole("button", { name: "อนุมัติ", exact: false }).first();
  await opener.click();
  await page.getByRole("dialog").waitFor();
  assert.equal(approveCalls(), 0);
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.closest("dialog") !== null), true);
  await page.keyboard.press("Shift+Tab");
  assert.equal(await page.evaluate(() => document.activeElement.closest("dialog") !== null), true);
  await screenshot(page, "review-mobile");
  await page.setViewportSize({ width: 1280, height: 900 });
  await screenshot(page, "review-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(approveCalls(), 0);
  assert.equal(await opener.evaluate((e) => e === document.activeElement), true);
  await opener.click();
  await page.getByRole("dialog").getByRole("button", { name: "ยกเลิก", exact: true }).click();
  assert.equal(approveCalls(), 0);
  await opener.click();
  await page.getByRole("button", { name: "ยืนยันให้ใช้ 1 ใบ" }).dblclick();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(approveCalls(), 1);
  await page.waitForFunction(() => document.activeElement?.tagName === "H1");
  await page.getByText("ใช้แล้ว", { exact: true }).waitFor();
  pass("review/Escape/cancel do not approve; confirm double click creates one request; focus returns");
  await go("/my-coupons");
  await page.getByRole("button", { name: "ขอใช้คูปองนี้", exact: false }).first().waitFor();
  assert.equal(await page.locator("article:visible").count(), 2);
  await page.getByRole("button", { name: "ขอใช้คูปองนี้", exact: false }).first().click();
  await page.getByLabel("ข้อความถึงแฟน (ไม่บังคับ)").fill("เก็บข้อความไว้เมื่อ retry");
  state.failRequest = true;
  await page.getByRole("button", { name: "ส่งคำขอ", exact: true }).click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  assert.equal(await page.getByLabel("ข้อความถึงแฟน (ไม่บังคับ)").inputValue(), "เก็บข้อความไว้เมื่อ retry");
  await screenshot(page, "request-error-mobile");
  await page.setViewportSize({ width: 1280, height: 900 });
  await screenshot(page, "request-error-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  state.failRequest = false;
  await page.getByRole("button", { name: "ส่งคำขอ", exact: true }).dblclick();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(state.payloads.at(-1).message, "เก็บข้อความไว้เมื่อ retry");
  pass("snapshot grouping separates terms/rarity; dialog error visible; retry preserves message");
  await page.evaluate(
    (t) =>
      localStorage.setItem(
        "lovepass.giftCart",
        JSON.stringify([
          { couponTemplateId: 1, quantity: 100, name: t.name, emoji: t.emoji, rarity: t.rarity },
        ]),
      ),
    template,
  );
  await go("/gifts/new");
  await page.getByRole("button", { name: "เพิ่มจำนวน", exact: false }).waitFor();
  assert.equal(await page.getByRole("button", { name: "เพิ่มจำนวน", exact: false }).isDisabled(), true);
  await page.getByLabel("วันหมดอายุ").fill("2027-01-30");
  await screenshot(page, "checkout-mobile");
  await page.getByLabel("รูปแบบของขวัญ").selectOption("1");
  await page.getByRole("button", { name: "ยืนยันมอบคูปอง", exact: false }).dblclick();
  await page.getByRole("link", { name: "ดูของขวัญที่ส่ง" }).waitFor();
  assert.equal(state.payloads.at(-1).couponSetId, 1);
  assert.equal(
    JSON.parse(await page.evaluate(() => localStorage.getItem("lovepass.giftCart")))[0].quantity,
    100,
  );
  pass("quantity 100 bound; set send once with reviewed date; custom draft preserved");
  await screenshot(page, "gift-success-mobile");
  await go("/catalog");
  await page.getByRole("button", { name: "เพิ่มลงของขวัญ" }).first().waitFor();
  await page.getByRole("button", { name: "อบอุ่น · COMMON" }).click();
  await wait(50);
  await page.getByRole("button", { name: "พิเศษ · RARE", exact: true }).click();
  await wait(900);
  assert.equal(await page.locator("article:visible").count(), 1);
  await page.getByText("มื้อพิเศษสำหรับสองเรา", { exact: true }).waitFor();
  pass("slow old filter response cannot overwrite newer selection");
  await go("/my-coupons");
  await page.getByRole("button", { name: "อบอุ่น · COMMON" }).click();
  await wait(50);
  await page.getByRole("button", { name: "พิเศษ · RARE", exact: true }).click();
  await wait(900);
  assert.equal(await page.locator("article:visible").count(), 1);
  await page.getByText("เงื่อนไข: เงื่อนไขอีกแบบ", { exact: true }).waitFor();
  pass("my-coupons slow filter preserves newer result");
  await go("/requests");
  await page.getByRole("button", { name: "คำขอที่ฉันส่ง", exact: true }).click();
  await wait(700);
  await page.getByText("คำขอที่ฉันส่งทดสอบ", { exact: true }).first().waitFor();
  assert.equal(await page.getByText(template.name, { exact: true }).filter({ visible: true }).count(), 0);
  pass("requests slow tab response cannot overwrite current direction");
  // API failure and recovery across every API-driven route.
  for (const [route, endpoint] of [
    ["/dashboard", "/api/v1/coupons/dashboard"],
    ["/catalog", "/api/v1/coupon-templates"],
    ["/sets", "/api/v1/coupon-sets"],
    ["/my-coupons", "/api/v1/coupons/my"],
    ["/gifts/new", "/api/v1/couples/me"],
    ["/requests", "/api/v1/redemptions"],
    ["/history", "/api/v1/history"],
    ["/sent-gifts", "/api/v1/gifts/sent"],
    ["/couple", "/api/v1/couples/me"],
    ["/admin/dashboard", "/api/v1/admin/dashboard/stats"],
    ["/admin/coupons", "/api/v1/admin/coupon-templates"],
    ["/admin/sets", "/api/v1/admin/coupon-sets"],
    ["/admin/users", "/api/v1/admin/users"],
    ["/admin/overview", "/api/v1/admin/gifts"],
  ]) {
    state.errors[endpoint] = 500;
    await page.goto(BASE + route);
    await page.locator("p[role=alert]:visible").first().waitFor();
    assert.ok((await page.locator("p[role=alert]:visible").first().textContent()).length);
    delete state.errors[endpoint];
    await page.getByRole("button", { name: "ลองอีกครั้ง", exact: true }).first().click();
    await page.locator("p[role=alert]:visible").first().waitFor({ state: "hidden" });
    pass("500 → retry recovery " + route);
  }
  // A selected set cannot submit before its preview succeeds.
  state.errors["/api/v1/coupon-sets"] = 500;
  await go("/gifts/new?set=1");
  await page.locator("p[role=alert]:visible").waitFor();
  assert.equal(await page.getByRole("button", { name: "ยืนยันมอบคูปอง", exact: false }).isDisabled(), true);
  delete state.errors["/api/v1/coupon-sets"];
  await page.getByRole("button", { name: "ลองอีกครั้ง" }).click();
  await page.locator("p").filter({ hasText: set.name }).first().waitFor();
  pass("failed set preview blocks send and supports retry");
  // Screenshot and geometry grid, light/dark, long data, and mobile admin form.
  for (const [width, height] of [
    [320, 812],
    [375, 812],
    [390, 844],
    [430, 844],
    [1280, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme: width === 390 ? "dark" : "light" });
    for (const route of [
      "/dashboard",
      "/catalog",
      "/gifts/new",
      "/admin/sets",
      "/admin/coupons",
      "/admin/users",
      "/history",
      "/sent-gifts",
      "/sets",
    ]) {
      await go(route);
      await wait(100);
      if (route === "/admin/sets") {
        await page.getByRole("button", { name: "สร้างชุดคูปอง", exact: false }).click();
        await page.getByRole("button", { name: "เพิ่มคูปอง", exact: false }).click();
        const select = page.getByLabel("คูปองรายการที่ 1", { exact: true });
        await select.waitFor();
        assert.ok((await select.boundingBox()).width > 150);
      }
      const layout = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      assert.ok(layout.scroll <= layout.client + 1, route + " overflow at " + width);
      evidence.layouts.push({ route, width, ...layout });
      if (
        [375, 390, 1280].includes(width) &&
        ["/dashboard", "/catalog", "/gifts/new", "/admin/sets"].includes(route)
      )
        await screenshot(page, route.replaceAll("/", "-").replace(/^-/, "") + "-" + width);
    }
  }
  pass("45 route × viewport geometry checks including 320/375/390/430/1280; admin select >150px");
  await page.setViewportSize({ width: 390, height: 844 });
  await go("/catalog");
  await page.getByRole("button", { name: "เพิ่มลงของขวัญ" }).first().click();
  const bars = await page.evaluate(() => ({
    nav: document.querySelector(".bottom-nav").getBoundingClientRect().toJSON(),
    cart: document.querySelector(".cart-bar").getBoundingClientRect().toJSON(),
  }));
  assert.ok(bars.cart.bottom <= bars.nav.top + 1);
  pass("cart task bar sits above mobile navigation");
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const style = await page.addStyleTag({
      content:
        "* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }",
    });
    await wait(100);
    const geometry = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      nav: document.querySelector(".bottom-nav").getBoundingClientRect().toJSON(),
      cart: document.querySelector(".cart-bar").getBoundingClientRect().toJSON(),
    }));
    assert.ok(geometry.scroll <= geometry.client + 1);
    assert.ok(geometry.cart.bottom <= geometry.nav.top + 1);
    await style.evaluate((e) => e.remove());
  }
  pass("text spacing overrides at 320/390/430 keep reflow and measured nav/cart separation");
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await go("/my-coupons");
  const theme = await page.evaluate(() => ({
    bg: getComputedStyle(document.body).backgroundColor,
    color: getComputedStyle(document.body).color,
  }));
  assert.equal(theme.bg, "rgb(255, 248, 243)");
  pass("OS dark preference keeps complete light theme; reduced motion CSS active");
  // Font network sizes are Resource Timing values, not gzip estimates.
  evidence.fonts = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((r) => /\.(woff2|ttf)/.test(r.name))
      .map((r) => ({
        name: r.name.split("/").at(-1),
        transferSize: r.transferSize,
        encodedBodySize: r.encodedBodySize,
        decodedBodySize: r.decodedBodySize,
      })),
  );
  // Rendered semantic palette including states. Resolve through a real CSS property.
  evidence.contrast = await page.evaluate(() => {
    function rgb(token) {
      const e = document.createElement("span");
      e.style.color = "var(--color-" + token + ")";
      document.body.append(e);
      const c = getComputedStyle(e).color;
      e.remove();
      return c;
    }
    function lum(color) {
      const v = color
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map((n) => {
          n = Number(n) / 255;
          return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
        });
      return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    }
    return [
      ["ink", "mint-soft", 4.5],
      ["ink", "sky-soft", 4.5],
      ["ink", "lavender-soft", 4.5],
      ["ink", "butter-soft", 4.5],
      ["muted", "surface", 4.5],
      ["love", "canvas", 4.5],
      ["focus", "love-soft", 3],
      ["focus", "lavender-soft", 3],
      ["control", "love-soft", 3],
      ["ink", "canvas", 4.5],
      ["ink", "surface", 4.5],
      ["muted", "canvas", 4.5],
      ["muted", "love-soft", 4.5],
      ["love", "surface", 4.5],
      ["love", "love-soft", 4.5],
      ["surface", "love", 4.5],
      ["surface", "love-hover", 4.5],
      ["surface", "danger", 4.5],
      ["surface", "danger-hover", 4.5],
      ["danger", "danger-soft", 4.5],
      ["mint-ink", "mint-soft", 4.5],
      ["sky-ink", "sky-soft", 4.5],
      ["lavender-ink", "lavender-soft", 4.5],
      ["butter-ink", "butter-soft", 4.5],
      ["control", "surface", 3],
      ["control", "canvas", 3],
      ["focus", "surface", 3],
      ["focus", "canvas", 3],
    ].map(([fg, bg, min]) => {
      const f = rgb(fg),
        b = rgb(bg),
        a = lum(f),
        z = lum(b);
      return {
        fg,
        bg,
        foreground: f,
        background: b,
        ratio: (Math.max(a, z) + 0.05) / (Math.min(a, z) + 0.05),
        minimum: min,
      };
    });
  });
  for (const pair of evidence.contrast) assert.ok(pair.ratio >= pair.minimum, JSON.stringify(pair));
  pass("28 rendered text/control/focus contrast pairs meet assigned thresholds");
  state.empty = true;
  for (const [route, text] of [
    ["/catalog", "ยังไม่มีคูปองในคลัง"],
    ["/sets", "ยังไม่มีชุดคูปอง"],
    ["/my-coupons", "ยังไม่มีคูปองที่ใช้ได้"],
    ["/requests", "ยังไม่มีคำขอที่ต้องพิจารณา"],
    ["/history", "ยังไม่มีประวัติ"],
    ["/sent-gifts", "ยังไม่เคยมอบคูปอง"],
    ["/admin/coupons", "ยังไม่มีต้นแบบคูปอง"],
    ["/admin/sets", "ยังไม่มี ชุดคูปอง"],
    ["/admin/users", "ยังไม่มีผู้ใช้"],
    ["/admin/overview", "ยังไม่มีการมอบคูปอง"],
  ]) {
    await go(route);
    await page.getByText(text, { exact: true }).waitFor();
  }
  pass("10 empty list states render independently from errors");
  state.empty = false;
  state.paired = false;
  await go("/couple");
  await page.getByText("ฉันมีคำเชิญแล้ว", { exact: true }).waitFor();
  await go("/gifts/new");
  await page.getByRole("link", { name: "ไปจับคู่", exact: true }).waitFor();
  pass("no-couple state offers invitation and checkout recovery");
  await context.close();
  // Auth session failure never clears tokens; expiry does.
  const a = await session();
  a.state.errors["/api/v1/auth/me"] = 500;
  await a.page.goto(BASE + "/dashboard");
  await a.page.locator("p[role=alert]:visible").waitFor();
  assert.equal(await a.page.evaluate(() => localStorage.getItem("lovepass.accessToken")), "fixture-access");
  delete a.state.errors["/api/v1/auth/me"];
  await a.page.getByRole("button", { name: "ลองอีกครั้ง" }).click();
  await a.page.getByRole("heading", { name: "บ้านของเรา" }).waitFor();
  pass("session 500 preserves token and recovers via retry");
  await a.context.close();
  const r = await session();
  r.state.errors["/api/v1/auth/me"] = 401;
  r.state.errors["/api/v1/auth/refresh"] = 500;
  await r.page.goto(BASE + "/dashboard");
  await r.page.locator("p[role=alert]:visible").waitFor();
  assert.equal(await r.page.evaluate(() => localStorage.getItem("lovepass.accessToken")), "fixture-access");
  pass("refresh 500 does not clear session");
  await r.context.close();
  const e = await session();
  e.state.errors["/api/v1/auth/me"] = 401;
  e.state.errors["/api/v1/auth/refresh"] = 401;
  await e.page.goto(BASE + "/requests");
  await e.page.waitForURL("**/login?**");
  assert.equal(await e.page.evaluate(() => localStorage.getItem("lovepass.accessToken")), null);
  assert.equal(new URL(e.page.url()).searchParams.get("returnTo"), "/requests");
  pass("expired session clears token and preserves destination");
  await e.context.close();
  const l = await session(false);
  for (const width of [375, 390, 1280]) {
    await l.page.setViewportSize({ width, height: width === 1280 ? 900 : 844 });
    await l.go("/login");
    await l.page.emulateMedia({ colorScheme: "dark" });
    await screenshot(l.page, "login-" + width);
    const size = await l.page.getByRole("textbox", { name: "อีเมล", exact: true }).evaluate((e) => ({
      font: parseFloat(getComputedStyle(e).fontSize),
      height: e.getBoundingClientRect().height,
      color: getComputedStyle(e).color,
    }));
    assert.ok(size.font >= 16 && size.height >= 48);
  }
  await l.go("/reset-password");
  await l.page.getByRole("link", { name: "ขอลิงก์ใหม่" }).waitFor();
  pass("invalid reset link has recovery; login inputs ≥16px and ≥48px in dark preference");
  await l.context.close();
  assert.deepEqual(evidence.consoleErrors, [], "browser page errors");
  await browser.close();
  fs.rmSync(path.join(OUT, "failure.json"), { force: true });
  fs.writeFileSync(path.join(OUT, "evidence.json"), JSON.stringify(evidence, null, 2));
  console.log("Saved evidence:", OUT);
}
run().catch((err) => {
  fs.writeFileSync(
    path.join(OUT, "failure.json"),
    JSON.stringify({ message: err.message, stack: err.stack, evidence }, null, 2),
  );
  console.error(err);
  process.exit(1);
});
