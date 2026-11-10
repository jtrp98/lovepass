import type { ReceivedGift } from "@/types";
import { couponCategories, resolveCategory } from "./coupon-categories.ts";

export interface KeepsakeCopy {
  salutation: string;
  headline: string;
  noteBody: string;
  hasCustomMessage: boolean;
  isLongNote: boolean;
  signature: string;
  footnote: string;
  dateStamp: string;
  whisper?: string;
  crossedOut?: string;
  correction?: string;
}

export function buildKeepsakeCopy(
  gift: ReceivedGift,
  recipientName?: string | null,
): KeepsakeCopy {
  const name = recipientName?.trim() || "เธอ";
  const sender = gift.senderName?.trim() || "";

  const salutation = `ถึง ${name}`;
  const headline = gift.title?.trim() || "ของขวัญสำหรับเธอ";
  const noteBody = gift.message?.trim() || "";
  const hasCustomMessage = noteBody.length > 0;
  const isLongNote = noteBody.length > 110;
  const signature = sender ? `— จาก ${sender}` : "";
  const footnote = "* เปิดใช้คูปองได้ทุกเมื่อจากกระเป๋าของคุณ";

  let dateStamp = "TODAY";
  try {
    const d = new Date(gift.createdAt);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const mon = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      dateStamp = `${day}.${mon}.${year}`;
    }
  } catch {
    dateStamp = "TODAY";
  }

  return {
    salutation,
    headline,
    noteBody,
    hasCustomMessage,
    isLongNote,
    signature,
    footnote,
    dateStamp,
  };
}

export function defaultCouponDescription(category: string, name: string): string {
  switch (category) {
    case "AFFECTION":
      return "เหนื่อยเมื่อไหร่ ก็มากอดกันนะ ♡";
    case "FOOD":
      return "มื้อนี้เธอเลือกเลย เราเลี้ยงเอง";
    case "TOGETHER":
      return "ใช้เวลานี้ด้วยกัน แบบไม่มีอะไรกวนใจ";
    case "CARE":
      return "วันนี้ให้เราดูแลเธอเองนะ";
    case "WISH":
      return "ขอได้หนึ่งข้อ เราจะตั้งใจฟังเลย";
    case "ADVENTURE":
      return "ไปเปิดประสบการณ์และเที่ยวด้วยกัน";
    case "GIFT":
      return "ของขวัญชิ้นพิเศษที่ตั้งใจเลือกให้";
    case "POWER":
      return "สิทธิ์พิเศษสำหรับใช้ร่วมกับคูปองอื่น";
    default:
      return `คำสัญญา “${name}” สำหรับเธอ`;
  }
}

const RARITY_COLORS: Record<string, { bg: string; border: string; ink: string; accent: string; badge: string }> = {
  COMMON: { bg: "#FFF5F7", border: "#EBC6D0", ink: "#765B60", accent: "#FADBE5", badge: "อบอุ่น" },
  RARE: { bg: "#F3F7FA", border: "#C8DCE8", ink: "#3E5C70", accent: "#DCE9EF", badge: "พิเศษ" },
  EPIC: { bg: "#F8F4FA", border: "#DECDE8", ink: "#5A4468", accent: "#EFE4F0", badge: "สุดพิเศษ" },
  LEGENDARY: { bg: "#FDF8ED", border: "#EADBBD", ink: "#68532D", accent: "#F6EBCF", badge: "ล้ำค่า" },
  MYTHIC: { bg: "#FAF4F6", border: "#ECC7D6", ink: "#765B60", accent: "#FADBE5", badge: "ในฝัน" },
};

// Inlined SVGs as data URIs for immediate, offline, CORS-free canvas rendering.
const WASHI_TAPE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="26" viewBox="0 0 96 26">
  <defs>
    <pattern id="d" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
      <circle cx="2" cy="2" r=".9" fill="#fffcf7" opacity=".75"/>
      <path d="M6 6.6s-1.3-.8-1.3-1.6c0-.8 1-1 1.3-.3.4-.7 1.3-.5 1.3.3 0 .8-1.3 1.6-1.3 1.6Z" fill="#c9688a" opacity=".55"/>
    </pattern>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".4"/>
      <stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#a64062" stop-opacity=".08"/>
    </linearGradient>
  </defs>
  <path d="M3 1.2 1.4 4l1.8 2.3L.8 9.6l2 2.6-1.6 3 1.9 2.4-1.7 3.4 1.6 2.4L2.6 25h90.6l1.6-2.5-1.4-2.6 1.8-3-1.7-2.7 1.9-2.6-1.6-3.1 1.7-2.4-1.8-2.8L95 1.2Z" fill="#f2c4d2" fill-opacity=".85"/>
  <path d="M3 1.2 1.4 4l1.8 2.3L.8 9.6l2 2.6-1.6 3 1.9 2.4-1.7 3.4 1.6 2.4L2.6 25h90.6l1.6-2.5-1.4-2.6 1.8-3-1.7-2.7 1.9-2.6-1.6-3.1 1.7-2.4-1.8-2.8L95 1.2Z" fill="url(#d)"/>
  <path d="M3 1.2 1.4 4l1.8 2.3L.8 9.6l2 2.6-1.6 3 1.9 2.4-1.7 3.4 1.6 2.4L2.6 25h90.6l1.6-2.5-1.4-2.6 1.8-3-1.7-2.7 1.9-2.6-1.6-3.1 1.7-2.4-1.8-2.8L95 1.2Z" fill="url(#s)"/>
  <path d="M5 3.4h86M5 22.6h86" stroke="#fffcf7" stroke-width=".6" stroke-dasharray="3 2" opacity=".6"/>
</svg>`;

const RIBBON_BOW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 52" fill="none">
  <g stroke="#59424c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M41 23C32 15 14 10 9 20c-5 10 6 19 32 8" fill="#fadbe5" />
    <path d="M37 21c-8-2-19 0-22 5" stroke="#e8b4c5" stroke-width="1.4" />
    <path d="M47 23c9-8 27-13 32-3 5 10-6 19-32 8" fill="#fadbe5" />
    <path d="M51 21c8-2 19 0 22 5" stroke="#e8b4c5" stroke-width="1.4" />
    <path d="M39 28c-4 7-10 15-18 20 4-2 7-6 9-7 2 2 3 5 4 8 2-6 5-14 6-20Z" fill="#fadbe5" />
    <path d="M49 28c4 7 10 15 18 20-4-2-7-6-9-7-2 2-3 5-4 8-2-6-5-14-6-20Z" fill="#fadbe5" />
    <ellipse cx="44" cy="24" rx="6" ry="5.5" fill="#f7c8d7" />
    <path d="M42 22q2 3 4 0" stroke="#59424c" stroke-width="1.3" />
  </g>
</svg>`;

// Category vector icons (matching public/illustrations/coupons/*.svg)
const CATEGORY_SVGS: Record<string, string> = {
  AFFECTION: `<path d="M26 75c-13-15-9-44 7-49 17-6 30 9 32 27m29 23c13-17 9-45-8-49-17-5-31 10-31 30"/><path d="M25 74c5 19 23 22 37 15 15 8 31 1 35-16M39 47v3m10-2v3m26-3v3m11-4v3M43 59q4 4 8 0m22 0q4 4 8 0"/><path d="M31 66c13 18 35 17 49 1m9 4C72 87 52 72 49 64m-20 26-4 8m20-5-1 7m33-7 1 7m17-10 4 7"/><path d="M59 20s-12-7-11-13c1-6 9-6 11-1 4-5 11-3 10 3-1 6-10 11-10 11Z" fill="currentColor" opacity=".75" stroke="none"/><path d="m11 47-5-3m98 0 6-3"/>`,
  TOGETHER: `<path d="M88 37c16 23 3 55-26 57-28 2-48-21-40-46 7-26 37-35 57-20" fill="var(--accent)"/><path d="M60 33v6m27 20h-6M60 86v-6M33 59h6M60 46v15l15 8M46 17l-9 6m43-6 9 7M38 94l-5 7m50-8 5 7"/><path d="M60 27S46 18 47 11c1-7 10-8 13-1 4-7 12-5 13 1 1 7-13 16-13 16Z" fill="var(--accent)"/><path d="m103 37 5-2M11 75l5 2m77-70 2 5"/>`,
  FOOD: `<path d="M84 41c14 22 0 46-24 47-23 1-38-22-28-44 9-19 37-24 52-3Z" fill="var(--accent)"/><path d="M76 47c9 15 0 31-16 31-15 0-25-14-18-29 6-13 24-15 34-2ZM15 31v24q0 9 7 9V98m0-68v34m7-33v24q0 9-7 9M102 31c-10 0-11 30-1 32v35m1-67c10 0 10 30-1 32"/><path d="M60 24S46 15 48 9c1-6 9-7 12-1 4-6 11-5 12 1 1 6-12 15-12 15Z" fill="currentColor" opacity=".7" stroke="none"/><path d="m39 11-3 5m49-2 4-4"/>`,
  CARE: `<path d="m23 43 4 31c3 23 47 25 54 2l6-33Z" fill="var(--accent)"/><path d="M87 48c28-2 24 29-6 30M18 97q40 7 77-1M43 35c-12-12 10-16-2-28m17 28c-12-12 10-16-2-28m18 28c-12-12 10-16-2-28"/><path d="M55 77S41 68 42 61c1-7 10-7 13-1 4-6 12-5 13 1 1 7-13 16-13 16Z"/><path d="m10 43 4 2m90-22v8m-4-4h8"/>`,
  WISH: `<path d="m63 19 10 24 26 4-20 17 5 27-23-14-24 12 6-27-19-19 27-2 12-22Z" fill="var(--accent)"/><path d="m63 19-2 58m12-34-12 34m18-13-18 13M24 43l37 34m-18-15 18 15M14 80q-3 15 12 17M8 63q-9 27 8 40m85-85v12m-6-6h12m-5 55 5 5m-2-5-5 5M31 15l-4 7m-6-7 7 3"/><path d="m94 9 4 4m-5 1 5-5"/>`,
  ADVENTURE: `<path d="m14 42 29-10 30 10 29-10 3 58-31 10-30-10-28 10Z" fill="var(--accent)"/><path d="m43 32 1 58m29-48 1 58M23 72l10-14 9 13m6 4 11-15 11 16m13 6 11-15 6 6"/><path d="M65 32S50 21 51 12c1-14 26-15 28 0 2 9-14 20-14 20Z"/><path d="M65 19a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm26-3 6 3m-68 5-4 4M12 16v8m-4-4h8"/>`,
  GIFT: `<path d="M25 53h65v42c0 3-2 5-5 5H30c-3 0-5-2-5-5Z" fill="var(--accent)"/><path d="M20 41h75v12H20Z" fill="var(--accent)"/><path d="M57 41v59m0-59c-13-15-29-6-18 0 6 3 12 2 18 0Zm0 0c13-15 29-6 18 0-6 3-12 2-18 0Z"/><path d="M60 43q14 5 22 16m-2-1 10-4 6 9-10 4Zm7 3h1"/><path d="M12 104q46 5 92-1M101 16v10m-5-5h10M15 21l4 4m0-4-4 4"/>`,
  POWER: `<path d="M17 33h86v15a8 8 0 0 0 0 16v15H17V64a8 8 0 0 0 0-16Z" fill="var(--accent)"/><path d="M81 37v38" stroke-dasharray="3 4"/><path d="M57 45a12 12 0 1 1-12 9m-2-8 2 8 8-2"/><path d="m92 50 1.6 4 4.4.5-3.3 2.8 1 4.3-3.7-2.4-3.7 2.4 1-4.3-3.3-2.8 4.4-.5Z"/><path d="M14 96q46 6 92 0M16 14v8m-4-4h8m84 70 4 4m0-4-4 4"/>`,
  OTHER: `<path d="M59 90S15 63 17 37C19 14 48 12 59 34c14-23 43-18 44 5 1 24-44 51-44 51Z" fill="var(--accent)"/><path d="m31 39 2-4m1 38q10 9 19 12M16 11l4 7m84 71 6 3"/>`,
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawTornNote(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - 14);

  // Deckled bottom torn edge from right to left
  for (let px = x + w; px >= x; px -= 3) {
    const relX = px - x;
    const wave = 10 + 2.5 * Math.sin(relX * 0.08) + 1.4 * Math.sin(relX * 0.22 + 1.2) + 0.8 * Math.sin(relX * 0.51 + 2.4);
    ctx.lineTo(px, y + h - 16 + wave);
  }

  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadSvgDataUrl(svgString: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load SVG data URL"));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  });
}

function wrapThaiText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (!text) return [];

  let words: string[] = [];
  try {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      const segmenter = new (Intl as unknown as { Segmenter: new (loc: string, opt: { granularity: string }) => { segment: (t: string) => Iterable<{ segment: string }> } }).Segmenter("th", { granularity: "word" });
      words = Array.from(segmenter.segment(text), (s) => s.segment);
    } else {
      words = text.split(/(\s+)/);
    }
  } catch {
    words = text.split(/(\s+)/);
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine + word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine.trim().length > 0) {
      lines.push(currentLine.trimEnd());
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trimEnd());
  }
  return lines;
}

export async function exportGiftStoryImage(
  gift: ReceivedGift,
  options?: { recipientName?: string | null },
): Promise<{ success: boolean; method: "share" | "download" }> {
  if (typeof window === "undefined") return { success: false, method: "download" };

  try {
    if (document.fonts) {
      await document.fonts.ready;
    }
  } catch {
    // Continue if fonts API not supported
  }

  const width = 1080;
  const height = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { success: false, method: "download" };

  const copy = buildKeepsakeCopy(gift, options?.recipientName);

  // 1. Background: Gentle romantic Blush Pink gradient with warm daylight
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#FAF0F4");
  bg.addColorStop(0.35, "#F7DDE5");
  bg.addColorStop(0.75, "#F4D2DE");
  bg.addColorStop(1, "#EFC7D5");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle ambient radial glow in the center
  const radialGlow = ctx.createRadialGradient(width / 2, height / 2, 60, width / 2, height / 2, 750);
  radialGlow.addColorStop(0, "rgba(255, 255, 255, 0.45)");
  radialGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // Pre-load essential decorative SVGs (inlined Data URLs: 100% offline, zero CORS taint)
  let tapeImg: HTMLImageElement | null = null;
  let bowImg: HTMLImageElement | null = null;
  try {
    [tapeImg, bowImg] = await Promise.all([
      loadSvgDataUrl(WASHI_TAPE_SVG),
      loadSvgDataUrl(RIBBON_BOW_SVG),
    ]);
  } catch {
    // Continue even if an asset fails to load
  }

  // 2. Pre-calculate dynamic layout & height for the floating Warm Ivory keepsake card
  const cardW = 900; // 90px margins on left and right (clears Instagram Story side UI)
  const cardX = (width - cardW) / 2; // 90px

  // Title wrapping
  ctx.font = 'bold 44px "Mali", "Sarabun", sans-serif';
  const titleLines = wrapThaiText(ctx, copy.headline, cardW - 250);

  // Note lines wrapping (only when sender provided a custom message)
  let noteLines: string[] = [];
  let noteH = 0;
  if (copy.hasCustomMessage && copy.noteBody) {
    ctx.font = copy.isLongNote ? '600 26px "Sarabun", sans-serif' : '600 30px "Mali", sans-serif';
    noteLines = wrapThaiText(ctx, `“${copy.noteBody}”`, cardW - 140);
    if (noteLines.length > 5) {
      noteLines = noteLines.slice(0, 5);
      noteLines[4] = noteLines[4].slice(0, -1) + "…";
    }
    const lineHeight = copy.isLongNote ? 40 : 46;
    noteH = 40 + noteLines.length * lineHeight + (copy.signature ? 48 : 28);
  }

  const couponCount = gift.coupons.length;
  const maxCoupons = couponCount === 4 ? 4 : Math.min(couponCount, 3);
  const ticketH = maxCoupons === 4 ? 134 : 156;
  const ticketGap = maxCoupons === 4 ? 12 : 16;
  const ticketsSectionH = 36 + maxCoupons * (ticketH + ticketGap) + (couponCount > maxCoupons ? 34 : 0);

  // Total height of the main card
  const headerH = 44 + titleLines.length * 52 + 20;
  let cardH = 50 + headerH + (copy.hasCustomMessage ? noteH + 28 : 16) + ticketsSectionH + 60;
  cardH = Math.min(cardH, 1440);

  // Center within Safe Zone (Y: 230 to 1675)
  const safeTop = 230;
  const safeBottom = 1675;
  const cardY = Math.max(safeTop, Math.min(safeBottom - cardH, Math.round((safeTop + safeBottom - cardH) / 2)));

  // 3. Draw Main Warm Ivory Keepsake Sheet
  ctx.save();
  ctx.shadowColor = "rgba(118, 91, 96, 0.16)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#FFF9F1"; // Warm Ivory cotton paper
  roundRect(ctx, cardX, cardY, cardW, cardH, 18);
  ctx.fill();
  ctx.restore();

  // Subtle outer border & inner dashed border
  ctx.save();
  ctx.strokeStyle = "#EAD2DC";
  ctx.lineWidth = 1.6;
  roundRect(ctx, cardX, cardY, cardW, cardH, 18);
  ctx.stroke();

  // Fine inner dashed border for artisanal handmade look
  ctx.strokeStyle = "rgba(215, 160, 175, 0.4)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  roundRect(ctx, cardX + 8, cardY + 8, cardW - 16, cardH - 16, 12);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 4. Corner Washi Tapes & Center Ribbon Bow
  if (tapeImg) {
    const tapeW = 150;
    const tapeH = 40;
    // Top-left tape tilted -7deg
    ctx.save();
    ctx.translate(cardX + 24, cardY - 10);
    ctx.rotate(-0.12);
    ctx.drawImage(tapeImg, -20, -10, tapeW, tapeH);
    ctx.restore();

    // Top-right tape tilted +6deg
    ctx.save();
    ctx.translate(cardX + cardW - tapeW - 6, cardY - 10);
    ctx.rotate(0.1);
    ctx.drawImage(tapeImg, 0, -10, tapeW, tapeH);
    ctx.restore();
  }

  if (bowImg) {
    ctx.save();
    const bowW = 86;
    const bowH = 50;
    ctx.drawImage(bowImg, cardX + (cardW - bowW) / 2, cardY - 22, bowW, bowH);
    ctx.restore();
  }

  // 5. Header Section
  let currentY = cardY + 44;

  // Top salutation line (left) & Vintage Date Stamp box (right)
  ctx.font = '600 24px "Sarabun", sans-serif';
  ctx.fillStyle = "#A77787";
  ctx.fillText(copy.salutation, cardX + 44, currentY + 14);

  // Date stamp container on top right
  const stampBoxW = 140;
  const stampBoxH = 34;
  const stampBoxX = cardX + cardW - stampBoxW - 44;
  const stampBoxY = currentY - 10;
  ctx.save();
  ctx.fillStyle = "#DCE9EF";
  roundRect(ctx, stampBoxX, stampBoxY, stampBoxW, stampBoxH, 6);
  ctx.fill();
  ctx.strokeStyle = "#A77787";
  ctx.lineWidth = 1.2;
  roundRect(ctx, stampBoxX, stampBoxY, stampBoxW, stampBoxH, 6);
  ctx.stroke();
  ctx.font = '700 18px ui-monospace, Consolas, monospace';
  ctx.fillStyle = "#5E464C";
  ctx.textAlign = "center";
  ctx.fillText(copy.dateStamp, stampBoxX + stampBoxW / 2, stampBoxY + 23);
  ctx.textAlign = "left";
  ctx.restore();

  currentY += 48;

  // Gift Title
  ctx.font = 'bold 44px "Mali", "Sarabun", sans-serif';
  ctx.fillStyle = "#59424C";
  for (const line of titleLines) {
    ctx.fillText(line, cardX + 44, currentY);
    currentY += 52;
  }

  currentY += 16;

  // 6. Pinned Torn-Paper Love Note (if custom message exists)
  if (copy.hasCustomMessage && copy.noteBody && noteLines.length > 0) {
    const pX = cardX + 36;
    const pW = cardW - 72;
    const pH = noteH;

    ctx.save();
    // Slight tilt for authentic scrapbook feel (-1 deg)
    const centerPX = pX + pW / 2;
    const centerPY = currentY + pH / 2;
    ctx.translate(centerPX, centerPY);
    ctx.rotate(-0.016);
    ctx.translate(-centerPX, -centerPY);

    // Shadow
    ctx.shadowColor = "rgba(118, 91, 96, 0.08)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = "#FFFDF8"; // Soft cream stationery
    drawTornNote(ctx, pX, currentY, pW, pH, 12);
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.strokeStyle = "#EADCE2";
    ctx.lineWidth = 1.2;
    drawTornNote(ctx, pX, currentY, pW, pH, 12);
    ctx.stroke();

    // Subtle Muted Blue notebook ruled lines
    ctx.strokeStyle = "rgba(220, 233, 239, 0.55)";
    ctx.lineWidth = 1;
    for (let ly = currentY + 44; ly < currentY + pH - 36; ly += (copy.isLongNote ? 40 : 46)) {
      ctx.beginPath();
      ctx.moveTo(pX + 24, ly);
      ctx.lineTo(pX + pW - 24, ly);
      ctx.stroke();
    }

    // Mini Washi tape sticker at top left of note
    if (tapeImg) {
      ctx.save();
      ctx.translate(pX + 40, currentY - 3);
      ctx.rotate(-0.14);
      ctx.drawImage(tapeImg, -36, -12, 72, 22);
      ctx.restore();
    }

    // Message text
    ctx.font = copy.isLongNote ? '600 26px "Sarabun", sans-serif' : '600 30px "Mali", sans-serif';
    ctx.fillStyle = "#59424C";
    let textY = currentY + (copy.isLongNote ? 42 : 46);
    const lineHeight = copy.isLongNote ? 40 : 46;
    for (const nLine of noteLines) {
      ctx.fillText(nLine, pX + 28, textY);
      textY += lineHeight;
    }

    // Sender signature
    if (copy.signature) {
      ctx.font = '600 24px "Mali", sans-serif';
      ctx.fillStyle = "#A77787";
      ctx.textAlign = "right";
      ctx.fillText(copy.signature, pX + pW - 28, currentY + pH - 18);
      ctx.textAlign = "left";
    }

    ctx.restore();

    currentY += pH + 24;
  }

  // 7. Attached Tickets Header
  ctx.font = '700 20px ui-monospace, Consolas, monospace';
  ctx.fillStyle = "#A77787";
  ctx.fillText("HANDMADE PROMISES · คำสัญญาจากใจ", cardX + 44, currentY);

  currentY += 20;

  // 8. Render Love Coupon Tickets
  const ticketW = cardW - 72;
  const stubW = 140;
  const mainW = ticketW - stubW;

  // Pre-load category SVG images
  const loadedCategoryImgs = new Map<string, HTMLImageElement>();
  for (let i = 0; i < maxCoupons; i++) {
    const c = gift.coupons[i];
    const cat = resolveCategory(c.category);
    if (!loadedCategoryImgs.has(cat)) {
      const paths = CATEGORY_SVGS[cat] || CATEGORY_SVGS.OTHER;
      const style = RARITY_COLORS[c.rarity] ?? RARITY_COLORS.COMMON;
      const catSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 110" fill="none"><g stroke="${style.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths.replace(/var\(--accent\)/g, style.accent)}</g></svg>`;
      try {
        const img = await loadSvgDataUrl(catSvg);
        loadedCategoryImgs.set(cat, img);
      } catch {
        // Continue if icon fails
      }
    }
  }

  // Alternating slight rotations for organic hand-cut feel
  const rotations = [-0.007, 0.007, -0.005, 0.005];

  for (let i = 0; i < maxCoupons; i++) {
    const coupon = gift.coupons[i];
    const tx = cardX + 36;
    const ty = currentY + i * (ticketH + ticketGap);
    const style = RARITY_COLORS[coupon.rarity] ?? RARITY_COLORS.COMMON;
    const rot = rotations[i % rotations.length];

    ctx.save();
    const cx = tx + ticketW / 2;
    const cy = ty + ticketH / 2;
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.translate(-cx, -cy);

    // Drop shadow
    ctx.shadowColor = "rgba(118, 91, 96, 0.08)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Ticket body background
    if (coupon.rarity === "MYTHIC") {
      const mythicBg = ctx.createLinearGradient(tx, ty, tx + ticketW, ty);
      mythicBg.addColorStop(0, "#FADBE5");
      mythicBg.addColorStop(0.25, "#F6EBCF");
      mythicBg.addColorStop(0.5, "#E5EEE4");
      mythicBg.addColorStop(0.75, "#E6EDF4");
      mythicBg.addColorStop(1, "#EFE4F0");
      ctx.fillStyle = mythicBg;
    } else {
      ctx.fillStyle = style.bg;
    }
    roundRect(ctx, tx, ty, ticketW, ticketH, 14);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Border
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 1.4;
    roundRect(ctx, tx, ty, ticketW, ticketH, 14);
    ctx.stroke();

    // Semicircular notches on top & bottom along perforation line
    const perfX = tx + mainW;
    ctx.fillStyle = "#FFF9F1"; // Matches main paper
    ctx.beginPath();
    ctx.arc(perfX, ty, 8, 0, Math.PI); // Top notch
    ctx.fill();
    ctx.arc(perfX, ty + ticketH, 8, Math.PI, 0); // Bottom notch
    ctx.fill();

    ctx.strokeStyle = style.border;
    ctx.beginPath();
    ctx.arc(perfX, ty, 8, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(perfX, ty + ticketH, 8, Math.PI, 0);
    ctx.stroke();

    // Dashed perforation line
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(perfX, ty + 10);
    ctx.lineTo(perfX, ty + ticketH - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Category icon circular vignette
    const iconDiameter = maxCoupons === 4 ? 54 : 64;
    const iconX = tx + 20;
    const iconY = ty + (ticketH - iconDiameter) / 2;

    ctx.fillStyle = style.accent;
    ctx.beginPath();
    ctx.arc(iconX + iconDiameter / 2, iconY + iconDiameter / 2, iconDiameter / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const catKey = resolveCategory(coupon.category);
    const catImg = loadedCategoryImgs.get(catKey);
    if (catImg) {
      const pad = maxCoupons === 4 ? 8 : 10;
      ctx.drawImage(catImg, iconX + pad, iconY + pad, iconDiameter - pad * 2, iconDiameter - pad * 2);
    }

    // Category label & Rarity badge
    const catLabel = couponCategories[catKey].label;
    const rarityLabel = style.badge;

    const contentX = iconX + iconDiameter + 18;
    ctx.font = '600 18px "Sarabun", sans-serif';
    ctx.fillStyle = style.ink;
    ctx.fillText(`${catLabel} · ${rarityLabel}`, contentX, ty + (maxCoupons === 4 ? 30 : 36));

    // Coupon Name (Bold & prominent)
    ctx.font = maxCoupons === 4 ? 'bold 26px "Sarabun", sans-serif' : 'bold 30px "Sarabun", sans-serif';
    ctx.fillStyle = "#4A2835";
    const titleMaxW = mainW - (contentX - tx) - 16;
    const cTitleLines = wrapThaiText(ctx, coupon.name, titleMaxW);
    const firstTitleLine = cTitleLines[0] || coupon.name;
    ctx.fillText(firstTitleLine, contentX, ty + (maxCoupons === 4 ? 60 : 72));

    // Coupon Description (Handwritten promise detail)
    const descText = coupon.description?.trim() || defaultCouponDescription(catKey, coupon.name);
    ctx.font = maxCoupons === 4 ? '600 18px "Mali", sans-serif' : '600 22px "Mali", sans-serif';
    ctx.fillStyle = "#765B60";
    let descDisplay = descText;
    if (ctx.measureText(descDisplay).width > titleMaxW) {
      while (ctx.measureText(descDisplay + "…").width > titleMaxW && descDisplay.length > 0) {
        descDisplay = descDisplay.slice(0, -1);
      }
      descDisplay += "…";
    }
    ctx.fillText(descDisplay, contentX, ty + (maxCoupons === 4 ? 88 : 108));

    // Expiry date on bottom line
    let expStr = "";
    try {
      const expDate = new Date(coupon.expiresAt);
      if (!isNaN(expDate.getTime())) {
        expStr = `ใช้ได้ถึง ${expDate.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}`;
      }
    } catch {
      expStr = "";
    }
    if (expStr && maxCoupons !== 4) {
      ctx.font = '500 16px "Sarabun", sans-serif';
      ctx.fillStyle = "#A77787";
      ctx.fillText(expStr, contentX, ty + 134);
    }

    // Right stub: Quantity stamp
    ctx.font = 'bold 32px "Mali", "Sarabun", sans-serif';
    ctx.fillStyle = "#A77787";
    ctx.textAlign = "center";
    ctx.fillText(`×${coupon.quantity}`, perfX + stubW / 2, ty + ticketH / 2 + 2);

    ctx.font = '500 16px "Sarabun", sans-serif';
    ctx.fillStyle = "#A77787";
    ctx.fillText("ใบสำหรับเธอ", perfX + stubW / 2, ty + ticketH / 2 + 26);
    ctx.textAlign = "left";

    ctx.restore();
  }

  currentY += maxCoupons * (ticketH + ticketGap);

  // If there are more coupons beyond the displayed count
  if (couponCount > maxCoupons) {
    const extra = couponCount - maxCoupons;
    ctx.font = '600 22px "Mali", sans-serif';
    ctx.fillStyle = "#A77787";
    ctx.textAlign = "center";
    ctx.fillText(`+ อีก ${extra} คำสัญญาที่เก็บไว้ให้เธอในซอง ♡`, cardX + cardW / 2, currentY + 14);
    ctx.textAlign = "left";
    currentY += 28;
  }

  // 9. Card Bottom: Playful Footnote
  ctx.save();
  ctx.font = '500 19px "Sarabun", sans-serif';
  ctx.fillStyle = "#A77787";
  ctx.textAlign = "center";
  ctx.fillText(copy.footnote, cardX + cardW / 2, cardY + cardH - 24);
  ctx.restore();

  // 10. Below Main Card (Outside Artifact): Discreet attribution
  ctx.save();
  ctx.font = '600 20px ui-monospace, Consolas, monospace';
  ctx.fillStyle = "#B08392";
  ctx.textAlign = "center";
  ctx.fillText("a little love, made by hand ♡ love pass", width / 2, Math.min(height - 40, cardY + cardH + 34));
  ctx.restore();

  // 11. Generate Blob & Execute Share or Download
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve({ success: false, method: "download" });
        return;
      }

      const filename = `lovepass-gift-${gift.id}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      // Try Web Share API with files (iOS Safari, Android Chrome)
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: gift.title || "ของขวัญจากแฟน 💖",
            text: `ได้รับของขวัญจาก ${gift.senderName} ใน LOVE PASS 💌`,
          });
          resolve({ success: true, method: "share" });
          return;
        } catch (err: unknown) {
          // If user cancels share sheet (AbortError), don't force a fallback download
          if (err instanceof Error && err.name === "AbortError") {
            resolve({ success: true, method: "share" });
            return;
          }
        }
      }

      // Fallback: direct download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve({ success: true, method: "download" });
    }, "image/png");
  });
}
