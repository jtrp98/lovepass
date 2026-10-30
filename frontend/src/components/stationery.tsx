import type { ReactNode } from "react";
import type { Rarity } from "@/types";

/** Pressed wax seal (public/materials/illustrations/wax-seal.svg). Decorative. */
export function WaxSeal({ className = "" }: { className?: string }) {
  return <span className={`wax-seal ${className}`} aria-hidden="true" />;
}

/**
 * Folded envelope that opens once to show a letter card. Decorative: the page states
 * the outcome in text. Its resting state is open, so reduced motion shows the result.
 */
export function Envelope({ children, open = true, animate = true, rarity }: { children?: ReactNode; open?: boolean; animate?: boolean; rarity?: Rarity }) {
  return (
    <div className="envelope" data-closed={!open || undefined} data-still={!animate || undefined} data-rarity={rarity} aria-hidden="true">
      <svg className="envelope-back" viewBox="0 0 200 130" focusable="false">
        <rect x=".5" y=".5" width="199" height="129" rx="5" fill="#f3d6df" stroke="#d9aebb" />
        <path d="M6 6 100 60 194 6" fill="none" stroke="#e6bfcb" />
      </svg>
      <div className="envelope-letter">{children}</div>
      <svg className="envelope-front" viewBox="0 0 200 130" focusable="false">
        <path d="M.5 8 96 70a7 7 0 0 0 8 0L199.5 8v116.5a5 5 0 0 1-5 5H5.5a5 5 0 0 1-5-5Z" fill="#fbe7ed" stroke="#d9aebb" />
        <path d="M2 127 84 62M198 127 116 62" fill="none" stroke="#e8c2ce" strokeWidth="1.2" />
        <path d="M14 116h46M14 121h30" stroke="#d9aebb" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <div className="envelope-flap">
        <svg viewBox="0 0 200 80" focusable="false">
          <path d="M.5 5a5 5 0 0 1 5-4.5h189a5 5 0 0 1 5 4.5L104 74a7 7 0 0 1-8 0Z" fill="#f7dce4" stroke="#d9aebb" />
          <path d="M10 6 100 66 190 6" fill="none" stroke="#fffcf7" strokeOpacity=".6" />
        </svg>
        <WaxSeal />
      </div>
    </div>
  );
}

const icons = {
  gift: <><rect x="4" y="11" width="24" height="17" rx="1.5" /><path d="M2.5 7.5h27v4h-27zM16 7.5V28M16 7.5c-3-5-9-5.5-9-2 0 2 4 2 9 2Zm0 0c3-5 9-5.5 9-2 0 2-4 2-9 2Z" /></>,
  check: <><circle cx="16" cy="16" r="12.5" strokeDasharray="2.2 1.6" /><path d="m10 16.5 4 4 8-9" strokeWidth="2.2" /></>,
  hourglass: <path d="M8 3.5h16M8 28.5h16M10 3.5c0 7 12 7 12 12.5S10 21.5 10 28.5M22 3.5c0 7-12 7-12 12.5s12 5.5 12 12.5M13 25.5h6" />,
  hearts: <><path d="M12 25S3 19.5 3 13.6C3 9.3 9 8 12 12.4 15 8 21 9.3 21 13.6 21 19.5 12 25 12 25Z" /><path d="M22.5 15.5S29 11.6 29 7.6c0-2.9-4-3.8-6.5-.9-2.5-2.9-6.5-2-6.5.9" /></>,
  letter: <><rect x="3" y="7" width="26" height="19" rx="2" /><path d="m3.5 8 12.5 9.5L28.5 8" /><path d="M16 23s-3.4-2.1-3.4-4.3c0-1.7 2.4-2.2 3.4-.6 1-1.6 3.4-1.1 3.4.6 0 2.2-3.4 4.3-3.4 4.3Z" fill="currentColor" stroke="none" /></>,
  ticket: <><path d="M3 9a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v3.5a3.5 3.5 0 0 0 0 7V23a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.5a3.5 3.5 0 0 0 0-7Z" /><path d="M21 8v16" strokeDasharray="1.6 2" /><path d="M12 20s-3.4-2.1-3.4-4.3c0-1.7 2.4-2.2 3.4-.6 1-1.6 3.4-1.1 3.4.6 0 2.2-3.4 4.3-3.4 4.3Z" fill="currentColor" stroke="none" /></>,
} as const;
export type StationeryIconName = keyof typeof icons;

/** Hand-drawn line icons in the ticket illustration style. Decorative. */
export function StationeryIcon({ name, className = "" }: { name: StationeryIconName; className?: string }) {
  return (
    <svg className={`stationery-icon ${className}`} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {icons[name]}
    </svg>
  );
}
