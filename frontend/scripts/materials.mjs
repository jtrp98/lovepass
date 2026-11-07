// Generates the geometric stationery materials in public/materials.
// Run with: node scripts/materials.mjs
// Hand-drawn assets (paper fibre, washi tape, wax seal) live beside the output and are not touched.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../public/materials/", import.meta.url));
const write = (file, svg) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), svg.trim() + "\n");
  console.log("wrote", file);
};
const n = (value) => +value.toFixed(2);
const wave = (width, y, amplitude, period, phase, step = 1) => {
  const points = [];
  for (let x = 0; x <= width; x += step) points.push(`${n(x)} ${n(y + amplitude * Math.sin((2 * Math.PI * x) / period + phase))}`);
  return "M" + points.join("L");
};

// Security-print guilloché: phase-shifted waves twist into stacked ropes, pre-tinted in faint ink.
{
  const width = 48, height = 14, lines = [];
  for (let k = 0; k < 6; k++) lines.push(wave(width, height / 2, height / 2 - 0.4, width, (k * Math.PI) / 3));
  write("tickets/guilloche.svg", `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g fill="none" stroke="#59424c" stroke-opacity=".13" stroke-width=".5">${lines.map((d) => `<path d="${d}"/>`).join("")}</g>
</svg>`);
}

// Printed frame corners echo the die-cut notch: a quarter arc, a tiny heart and two seed dots.
{
  const corner = (transform) => `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <g transform="${transform}" fill="none" stroke="#000" stroke-linecap="round">
    <path d="M1 15A14 14 0 0 0 15 1" stroke-width="1"/>
    <path d="M1 20A19 19 0 0 0 20 1" stroke-width=".5" stroke-dasharray="1 2"/>
    <path d="M9.5 12.2s-3.6-2.3-3.6-4.4c0-2.2 2.7-2.8 3.6-.9 1-1.9 3.7-1.3 3.7.9 0 2.1-3.7 4.4-3.7 4.4Z" fill="#000" stroke="none"/>
    <circle cx="17" cy="9" r=".9" fill="#000" stroke="none"/><circle cx="9" cy="17" r=".9" fill="#000" stroke="none"/>
  </g>
</svg>`;
  write("tickets/corner-tl.svg", corner(""));
  write("tickets/corner-tr.svg", corner("translate(28 0) scale(-1 1)"));
  write("tickets/corner-bl.svg", corner("translate(0 28) scale(1 -1)"));
  write("tickets/corner-br.svg", corner("translate(28 28) scale(-1 -1)"));
}

// Postmark cancellation waves. Mask only.
{
  const width = 160, lines = [0, 1, 2, 3, 4].map((i) => wave(width, 6 + i * 8, 2.6, 40, i * 0.35, 2));
  write("stamps/postmark-waves.svg", `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="44" viewBox="0 0 ${width} 44">
  <g fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round">${lines.map((d) => `<path d="${d}"/>`).join("")}</g>
</svg>`);
}

// Perforated postage stamp with an illustrated heart-and-sprig vignette.
{
  const width = 72, height = 86, radius = 2.6, pitch = 7.2, holes = [];
  for (let x = pitch / 2; x < width; x += pitch) holes.push([x, 0], [x, height]);
  for (let y = pitch / 2; y < height; y += pitch) holes.push([0, y], [width, y]);
  write("stamps/postage-heart.svg", `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <mask id="perf"><rect width="${width}" height="${height}" fill="#fff"/>${holes.map(([x, y]) => `<circle cx="${n(x)}" cy="${n(y)}" r="${radius}"/>`).join("")}</mask>
    <filter id="tooth" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".7" seed="5"/><feDisplacementMap in="SourceGraphic" scale="1.2"/></filter>
    <pattern id="ground" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#fadbe5"/><circle cx="2" cy="2" r=".45" fill="#e7a9bd"/></pattern>
  </defs>
  <g mask="url(#perf)" filter="url(#tooth)"><rect width="${width}" height="${height}" fill="#fffcf7"/></g>
  <rect x="7" y="7" width="${width - 14}" height="${height - 14}" fill="url(#ground)" stroke="#a4516b" stroke-width=".8"/>
  <rect x="9.5" y="9.5" width="${width - 19}" height="${height - 19}" fill="none" stroke="#a4516b" stroke-width=".4" stroke-dasharray="1.4 1.2"/>
  <g stroke="#59424c" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
    <path d="M36 61s-14-8.5-14-17c0-6.5 9.5-8.5 14-1.5 4.5-7 14-5 14 1.5 0 8.5-14 17-14 17Z" fill="#e9789a"/>
    <path d="M29.5 44.5c.8-2.5 3-3.6 5-3" fill="none" stroke="#fffcf7" stroke-width="1.4"/>
    <path d="M36 61c-.6 4.5 1.4 7.5 4.6 9.5M38 66.5c2.6-.6 4.4.2 5.6 2-2.6.8-4.4.2-5.6-2Z" fill="#b9d3bd"/>
    <path d="m20 30 1.6 3.4M52 30l-1.6 3.4M36 26v3.6" fill="none" stroke="#a4516b"/>
  </g>
  <text x="12" y="20" font-family="Georgia, serif" font-size="7.5" letter-spacing=".6" fill="#a4516b">LOVE</text>
  <text x="${width - 12}" y="20" text-anchor="end" font-family="Georgia, serif" font-size="9" font-style="italic" fill="#59424c">2</text>
  <text x="${width / 2}" y="${height - 11.5}" text-anchor="middle" font-family="ui-monospace, Consolas, monospace" font-size="4.2" letter-spacing=".8" fill="#59424c">FOR TWO · ALWAYS</text>
</svg>`);
}

// Typographic flourish: center heart with botanical vines and seed dots.
{
  const width = 240, height = 24;
  write("tickets/flourish-heart.svg", `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <path d="M120 17s-6.5-4.2-6.5-8.2c0-3 3.6-4.3 6.5-1.2 2.9-3.1 6.5-1.8 6.5 1.2 0 4-6.5 8.2-6.5 8.2Z" fill="currentColor" stroke="none"/>
    <path d="M109 11c-14-1-26-5-44-5-22 0-38 6-53 6" stroke-width="1"/>
    <path d="M131 11c14-1 26-5 44-5 22 0 38 6 53 6" stroke-width="1"/>
    <path d="M82 8.5c-4-4.5-9-5.5-14-3.5 3 4 8 5.5 14 3.5Z" fill="currentColor" opacity=".5"/>
    <path d="M158 8.5c4-4.5 9-5.5 14-3.5-3 4-8 5.5-14 3.5Z" fill="currentColor" opacity=".5"/>
    <path d="M96 9.8c-3-3-7-3.8-11-2.2 2.2 3 5.8 4 11 2.2Z" fill="currentColor" opacity=".4"/>
    <path d="M144 9.8c3-3 7-3.8 11-2.2-2.2 3-5.8 4-11 2.2Z" fill="currentColor" opacity=".4"/>
    <circle cx="8" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="232" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="20" cy="12" r="1" fill="currentColor" stroke="none"/>
    <circle cx="220" cy="12" r="1" fill="currentColor" stroke="none"/>
  </g>
</svg>`);
}

// Vintage double-oval postal cancellation seal for keepsake gifts.
{
  const width = 130, height = 82;
  write("stamps/keepsake-seal.svg", `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="65" cy="41" rx="63" ry="39" stroke-width="1.8"/>
    <ellipse cx="65" cy="41" rx="58" ry="34" stroke-width=".8" stroke-dasharray="2.5 2"/>
    <path d="M22 41h86M26 35h78M26 47h78" stroke-width=".6" opacity=".5"/>
    <text x="65" y="27" text-anchor="middle" font-family="ui-monospace, Consolas, monospace" font-size="7.5" font-weight="700" letter-spacing="1.8" fill="currentColor">★ LOVE PASS ★</text>
    <text x="65" y="44.5" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-style="italic" font-weight="600" letter-spacing=".6" fill="currentColor">Gift of Love</text>
    <text x="65" y="61" text-anchor="middle" font-family="ui-monospace, Consolas, monospace" font-size="6.5" font-weight="600" letter-spacing="1.2" fill="currentColor">SPECIAL FOR TWO</text>
  </g>
</svg>`);
}

// Scalloped lace security filigree edge for keepsake card heads.
{
  const width = 160, height = 12, arcs = [];
  for (let x = 0; x < width; x += 16) {
    arcs.push(`M${x} 2 Q${x + 8} 11 ${x + 16} 2`);
  }
  write("tickets/lace-edge.svg", `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g fill="none" stroke="currentColor" stroke-width=".8" stroke-linecap="round">
    <path d="${arcs.join(" ")}"/>
    <line x1="0" y1="1.5" x2="${width}" y2="1.5" stroke-width="1"/>
    ${Array.from({ length: 10 }, (_, i) => `<circle cx="${8 + i * 16}" cy="6" r=".8" fill="currentColor" stroke="none"/>`).join("")}
  </g>
</svg>`);
}

// Torn note edge mask: fibrous deckled edge with organic tearing frequencies.
{
  const width = 320, height = 24;
  const points = ["M0 0", "L320 0", "L320 12"];
  for (let x = 320; x >= 0; x -= 2) {
    const y = 14 + 3.2 * Math.sin(x * 0.08) + 1.8 * Math.sin(x * 0.22 + 1.2) + 0.9 * Math.sin(x * 0.51 + 2.4);
    points.push(`L${n(x)} ${n(y)}`);
  }
  points.push("Z");
  write("paper/torn-note-edge.svg", `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <path d="${points.join(" ")}" fill="#fff"/>
</svg>`);
}

// Vintage double-frame box stamp for keepsake creation date.
{
  const width = 112, height = 34;
  write("stamps/handmade-date-stamp.svg", `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="2" width="108" height="30" rx="6" stroke-width="1.4"/>
    <rect x="4.5" y="4.5" width="103" height="25" rx="4" stroke-width=".7" stroke-dasharray="2 1.5"/>
    <circle cx="8" cy="8" r=".8" fill="currentColor"/>
    <circle cx="104" cy="8" r=".8" fill="currentColor"/>
    <circle cx="8" cy="26" r=".8" fill="currentColor"/>
    <circle cx="104" cy="26" r=".8" fill="currentColor"/>
  </g>
</svg>`);
}
