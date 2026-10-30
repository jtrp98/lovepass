import { useId } from "react";

/**
 * A round postmark-style ink impression. Decorative; the adjacent status text remains
 * the accessible source of truth. `animate` plays the stamper pressing down once and
 * must only be set after the redemption has actually succeeded.
 */
export function RubberStamp({ date, animate = false }: { date?: string | null; animate?: boolean }) {
  const ring = useId();
  return (
    <span className="rubber-stamp" data-animate={animate || undefined} aria-hidden="true">
      <span className="stamp-impression">
        <svg className="stamp-ring" viewBox="0 0 120 120" focusable="false">
          <defs>
            <path id={ring + "top"} d="M14 60a46 46 0 0 1 92 0" />
            <path id={ring + "bottom"} d="M7.5 60a52.5 52.5 0 0 0 105 0" />
          </defs>
          <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="60" cy="60" r="38.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <text className="stamp-arc">
            <textPath href={`#${ring}top`} startOffset="50%" textAnchor="middle">A PROMISE KEPT</textPath>
          </text>
          <text className="stamp-arc">
            <textPath href={`#${ring}bottom`} startOffset="50%" textAnchor="middle">LOVE PASS · FOR TWO</textPath>
          </text>
          <path d="M8.4 60s-2.8-1.7-2.8-3.4c0-1.6 2-2 2.8-.6.8-1.4 2.8-1 2.8.6 0 1.7-2.8 3.4-2.8 3.4Zm103.2 0s-2.8-1.7-2.8-3.4c0-1.6 2-2 2.8-.6.8-1.4 2.8-1 2.8.6 0 1.7-2.8 3.4-2.8 3.4Z" fill="currentColor" transform="translate(0 2)" />
          <path d="M26 48h68M26 74h68" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span className="stamp-face">
          <span className="stamp-caption">ใช้สิทธิ์แล้ว</span>
          <strong>USED</strong>
          {date ? <time dateTime={date}>{new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
          })}</time> : <span className="stamp-caption">เก็บไว้ในความทรงจำ</span>}
        </span>
      </span>
      {animate && <svg className="stamp-tool" viewBox="0 0 120 150" focusable="false">
        <ellipse cx="60" cy="146" rx="46" ry="4" fill="var(--color-ink)" opacity=".12" />
        <path d="M60 6c13 0 22 7 22 17 0 8-6 13-12 15v26H50V38c-6-2-12-7-12-15C38 13 47 6 60 6Z" fill="#c99a6e" />
        <path d="M60 6c13 0 22 7 22 17 0 8-6 13-12 15v26h-5V36c7-2 12-6 12-13 0-8-6-14-17-17Z" fill="#a87a52" opacity=".55" />
        <path d="M48 16c3-4 8-6 13-6" stroke="#f1d9bd" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".8" />
        <rect x="14" y="64" width="92" height="56" rx="7" fill="#d6ae84" />
        <path d="M22 76c18 4 40-4 76 2M22 92c22 3 42-5 76 1M22 106c20 2 46-3 76 0" stroke="#b88c62" strokeWidth="1.2" fill="none" opacity=".7" />
        <rect x="14" y="64" width="92" height="10" rx="5" fill="#e6c49e" opacity=".7" />
        <rect x="10" y="120" width="100" height="10" rx="2" fill="#8a7068" />
        <rect x="12" y="130" width="96" height="9" rx="2" fill="currentColor" />
      </svg>}
    </span>
  );
}
