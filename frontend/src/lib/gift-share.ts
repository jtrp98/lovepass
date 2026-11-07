import type { ReceivedGift } from "@/types";
import { couponCategories, resolveCategory } from "@/lib/coupon-categories";
import { rarityStyles } from "@/components/ui";

const RARITY_COLORS: Record<string, { bg: string; border: string; ink: string }> = {
  COMMON: { bg: "#fdf0f4", border: "#e8b8c8", ink: "#8a455a" },
  RARE: { bg: "#f0f6fa", border: "#b2d1e5", ink: "#2b6385" },
  EPIC: { bg: "#f6f0fa", border: "#ceb8e4", ink: "#5b387e" },
  LEGENDARY: { bg: "#fdf8ee", border: "#e5cca0", ink: "#845e1b" },
  MYTHIC: { bg: "#fef3f7", border: "#e8b4cb", ink: "#7d2950" },
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

function drawFlourishHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number) {
  ctx.save();
  ctx.strokeStyle = "#a4516b";
  ctx.fillStyle = "#a4516b";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  // Center heart
  ctx.beginPath();
  ctx.moveTo(cx, cy + 9);
  ctx.bezierCurveTo(cx - 12, cy + 3, cx - 12, cy - 8, cx, cy - 3);
  ctx.bezierCurveTo(cx + 12, cy - 8, cx + 12, cy + 3, cx, cy + 9);
  ctx.fill();

  // Left & right curved branches
  const half = width / 2;
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy);
  ctx.bezierCurveTo(cx - half * 0.4, cy - 6, cx - half * 0.7, cy + 4, cx - half, cy);
  ctx.moveTo(cx + 18, cy);
  ctx.bezierCurveTo(cx + half * 0.4, cy - 6, cx + half * 0.7, cy + 4, cx + half, cy);
  ctx.stroke();

  // Dots
  ctx.beginPath();
  ctx.arc(cx - half - 8, cy, 3, 0, Math.PI * 2);
  ctx.arc(cx + half + 8, cy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWaxSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.fillStyle = "#a63354";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#801d3a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
  ctx.stroke();

  // Inner heart
  ctx.fillStyle = "#fde2eb";
  ctx.beginPath();
  ctx.moveTo(cx, cy + 10);
  ctx.bezierCurveTo(cx - 14, cy + 4, cx - 14, cy - 10, cx, cy - 4);
  ctx.bezierCurveTo(cx + 14, cy - 10, cx + 14, cy + 4, cx, cy + 10);
  ctx.fill();
  ctx.restore();
}

export async function exportGiftStoryImage(
  gift: ReceivedGift,
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

  // 1. Background: romantic warm blush gradient
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#fcf0f4");
  bg.addColorStop(0.5, "#fae6ed");
  bg.addColorStop(1, "#f5dbe3");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Decorative floating background heart silhouettes
  ctx.fillStyle = "rgba(224, 150, 172, 0.12)";
  const bgHearts = [
    [100, 160, 40],
    [980, 220, 50],
    [80, 960, 45],
    [1000, 1100, 36],
    [140, 1760, 55],
    [940, 1800, 42],
  ];
  for (const [hx, hy, hr] of bgHearts) {
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. The Main Analog Keepsake Sheet
  const cardX = 60;
  const cardY = 120;
  const cardW = width - 120;
  const cardH = height - 240;

  // Outer shadow
  ctx.save();
  ctx.shadowColor = "rgba(89, 66, 76, 0.18)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#fffcf7";
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.restore();

  // Airmail border on top edge of the card
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.clip();
  const stripeW = 28;
  const stripeH = 14;
  for (let sx = cardX - 50; sx < cardX + cardW + 50; sx += stripeW * 2) {
    ctx.fillStyle = "#d94e77";
    ctx.beginPath();
    ctx.moveTo(sx, cardY);
    ctx.lineTo(sx + stripeW, cardY);
    ctx.lineTo(sx, cardY + stripeH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#4585aa";
    ctx.beginPath();
    ctx.moveTo(sx + stripeW, cardY);
    ctx.lineTo(sx + stripeW * 2, cardY);
    ctx.lineTo(sx + stripeW, cardY + stripeH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Double printed rule
  ctx.strokeStyle = "rgba(164, 81, 107, 0.4)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, cardX + 24, cardY + 28, cardW - 48, cardH - 56, 12);
  ctx.stroke();

  ctx.strokeStyle = "rgba(164, 81, 107, 0.2)";
  ctx.lineWidth = 1;
  roundRect(ctx, cardX + 30, cardY + 34, cardW - 60, cardH - 68, 8);
  ctx.stroke();

  // 3. Top Line: Typewriter serial & brand
  ctx.font = '600 24px ui-monospace, Consolas, monospace';
  ctx.fillStyle = '#8a455a';
  ctx.fillText('AIRMAIL ✦ PAR AVION', cardX + 60, cardY + 84);

  ctx.font = 'bold 26px ui-monospace, Consolas, monospace';
  ctx.fillStyle = '#d94e77';
  ctx.textAlign = 'right';
  ctx.fillText(`No. GF-${String(gift.id).padStart(4, "0")}`, cardX + cardW - 60, cardY + 84);
  ctx.textAlign = 'left';

  // Vintage Postage Heart Vignette (top right)
  const stampX = cardX + cardW - 190;
  const stampY = cardY + 115;
  ctx.save();
  ctx.fillStyle = '#fceef3';
  ctx.strokeStyle = '#c97793';
  ctx.lineWidth = 2;
  roundRect(ctx, stampX, stampY, 130, 160, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a4516b';
  ctx.font = '600 16px ui-monospace, Consolas, monospace';
  ctx.fillText('LOVE PASS', stampX + 16, stampY + 30);

  // Stamp Heart
  ctx.fillStyle = '#d94e77';
  ctx.beginPath();
  const shx = stampX + 65;
  const shy = stampY + 85;
  ctx.moveTo(shx, shy + 22);
  ctx.bezierCurveTo(shx - 30, shy + 8, shx - 30, shy - 24, shx, shy - 8);
  ctx.bezierCurveTo(shx + 30, shy - 24, shx + 30, shy + 8, shx, shy + 22);
  ctx.fill();

  ctx.fillStyle = '#59424c';
  ctx.font = 'bold 15px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FOR TWO', shx, stampY + 140);
  ctx.textAlign = 'left';

  // Wavy cancellation lines across stamp
  ctx.strokeStyle = 'rgba(89, 66, 76, 0.65)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const wy = stampY + 50 + i * 20;
    ctx.moveTo(stampX - 45, wy);
    ctx.bezierCurveTo(stampX - 15, wy - 8, stampX + 25, wy + 8, stampX + 70, wy);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Header: Sender dedication & Gift Title
  ctx.font = '600 32px "Sarabun", sans-serif';
  ctx.fillStyle = '#8a455a';
  ctx.fillText(`ของขวัญจากใจ`, cardX + 60, cardY + 150);

  ctx.font = 'bold 44px "Mali", "Sarabun", sans-serif';
  ctx.fillStyle = '#59424c';
  const displayTitle = gift.title ? `“${gift.title}”` : 'คำสัญญาเล็ก ๆ ที่ตั้งใจมอบให้';
  ctx.fillText(displayTitle, cardX + 60, cardY + 215);

  ctx.font = '500 28px "Sarabun", sans-serif';
  ctx.fillStyle = '#7a606a';
  const totalCoupons = gift.coupons.reduce((sum, c) => sum + c.quantity, 0);
  ctx.fillText(`มอบโดย ${gift.senderName} 💖 รวมคำสัญญา ${totalCoupons} ใบ`, cardX + 60, cardY + 265);

  // Flourish heart divider
  drawFlourishHeart(ctx, cardX + cardW / 2, cardY + 315, 420);

  // 5. Love Note (Handwritten Letter on lined paper)
  let currentY = cardY + 355;
  if (gift.message) {
    const noteX = cardX + 50;
    const noteW = cardW - 100;
    const noteH = 210;

    // Note card
    ctx.save();
    ctx.fillStyle = '#fef6f8';
    ctx.strokeStyle = '#e8becb';
    ctx.lineWidth = 1.5;
    roundRect(ctx, noteX, currentY, noteW, noteH, 12);
    ctx.fill();
    ctx.stroke();

    // Washi tape at top of note
    ctx.fillStyle = 'rgba(235, 178, 196, 0.7)';
    ctx.fillRect(noteX + noteW / 2 - 80, currentY - 10, 160, 20);

    // Note Label
    ctx.font = '600 20px ui-monospace, Consolas, monospace';
    ctx.fillStyle = '#a4516b';
    ctx.fillText('A NOTE FOR YOU · เขียนไว้ให้เธอ', noteX + 24, currentY + 38);

    // Note Message in Mali font
    ctx.font = '600 34px "Mali", sans-serif';
    ctx.fillStyle = '#4a2835';

    // Word wrap message
    const msg = `“${gift.message}”`;
    const words = msg.split(' ');
    let line = '';
    let lineY = currentY + 90;
    const maxLineWidth = noteW - 140;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineWidth && n > 0) {
        ctx.fillText(line, noteX + 24, lineY);
        line = words[n] + ' ';
        lineY += 46;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, noteX + 24, lineY);

    // Sender signature
    ctx.font = 'italic 24px "Mali", sans-serif';
    ctx.fillStyle = '#8a455a';
    ctx.fillText(`— ด้วยรัก, ${gift.senderName}`, noteX + 24, currentY + noteH - 24);

    // Small Wax seal at corner
    drawWaxSeal(ctx, noteX + noteW - 45, currentY + noteH - 45, 30);
    ctx.restore();

    currentY += noteH + 40;
  }

  // 6. Perforation Dotted Line
  ctx.save();
  ctx.strokeStyle = '#d9aebb';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(cardX + 40, currentY);
  ctx.lineTo(cardX + cardW - 40, currentY);
  ctx.stroke();
  ctx.restore();

  currentY += 45;

  // 7. Attached Tickets Section Heading
  ctx.font = 'bold 30px "Sarabun", sans-serif';
  ctx.fillStyle = '#59424c';
  ctx.fillText('คำสัญญาที่แนบมาในซอง', cardX + 60, currentY);

  ctx.font = '22px ui-monospace, monospace';
  ctx.fillStyle = '#a4516b';
  ctx.fillText('TICKETS ATTACHED', cardX + 380, currentY - 2);

  currentY += 25;

  // 8. Mini Die-Cut Tickets
  const ticketW = cardW - 100;
  const ticketH = 150;
  const maxCoupons = Math.min(gift.coupons.length, 4);

  for (let i = 0; i < maxCoupons; i++) {
    const coupon = gift.coupons[i];
    const tx = cardX + 50;
    const ty = currentY + 20 + i * (ticketH + 22);
    const style = RARITY_COLORS[coupon.rarity] ?? RARITY_COLORS.COMMON;

    ctx.save();
    // Ticket background with drop shadow
    ctx.shadowColor = 'rgba(89, 66, 76, 0.08)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = style.bg;
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 2;
    roundRect(ctx, tx, ty, ticketW, ticketH, 14);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    // Side ticket notches
    ctx.fillStyle = '#fffcf7';
    ctx.beginPath();
    ctx.arc(tx, ty + ticketH / 2, 10, 0, Math.PI * 2);
    ctx.arc(tx + ticketW, ty + ticketH / 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = style.border;
    ctx.beginPath();
    ctx.arc(tx, ty + ticketH / 2, 10, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(tx + ticketW, ty + ticketH / 2, 10, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.stroke();

    // Category / Rarity pill
    const catLabel = couponCategories[resolveCategory(coupon.category)].label;
    const rarityLabel = rarityStyles[coupon.rarity]?.label.split(' · ')[0] ?? 'พิเศษ';

    ctx.font = '600 20px "Sarabun", sans-serif';
    ctx.fillStyle = style.ink;
    ctx.fillText(`${catLabel} · ${rarityLabel}`, tx + 40, ty + 42);

    // Coupon Name
    ctx.font = 'bold 34px "Sarabun", sans-serif';
    ctx.fillStyle = '#4a2835';
    ctx.fillText(coupon.name, tx + 40, ty + 85);

    // Coupon Description / Note
    if (coupon.description) {
      ctx.font = '500 22px "Sarabun", sans-serif';
      ctx.fillStyle = '#7a606a';
      const desc = coupon.description.length > 40 ? coupon.description.slice(0, 39) + '…' : coupon.description;
      ctx.fillText(desc, tx + 40, ty + 122);
    }

    // Quantity Badge (Right side stamp style)
    const badgeW = 120;
    const badgeH = 55;
    const bx = tx + ticketW - badgeW - 35;
    const by = ty + ticketH / 2 - badgeH / 2;

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, badgeW, badgeH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 28px "Mali", "Sarabun", sans-serif';
    ctx.fillStyle = '#d94e77';
    ctx.textAlign = 'center';
    ctx.fillText(`×${coupon.quantity} ใบ`, bx + badgeW / 2, by + 38);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // 9. Card Footer: Keepsake motto
  ctx.font = 'italic 24px "Mali", "Sarabun", sans-serif';
  ctx.fillStyle = '#8a455a';
  ctx.textAlign = 'center';
  ctx.fillText('เก็บใบนี้ไว้ใช้ด้วยกันนะ · เก็บเป็นความทรงจำแสนหวานของเราสองคน ♥', cardX + cardW / 2, cardY + cardH - 85);

  ctx.font = '600 20px ui-monospace, Consolas, monospace';
  ctx.fillStyle = '#b08392';
  ctx.fillText('LOVE PASS ✦ ROMANTIC STATIONERY FOR TWO', cardX + cardW / 2, cardY + cardH - 50);
  ctx.textAlign = 'left';

  // 10. Generate Blob & Execute Share or Download
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
