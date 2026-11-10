import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  LuGift,
  LuCheck,
  LuHourglass,
  LuHeart,
  LuMail,
  LuTicket,
  LuBookOpen,
  LuCamera,
} from "react-icons/lu";
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

const icons: Record<string, IconType> = {
  gift: LuGift,
  check: LuCheck,
  hourglass: LuHourglass,
  hearts: LuHeart,
  letter: LuMail,
  ticket: LuTicket,
  story: LuBookOpen,
  camera: LuCamera,
};

export type StationeryIconName = keyof typeof icons;

/** Line icons from react-icons in the romantic stationery style. Decorative. */
export function StationeryIcon({ name, className = "" }: { name: StationeryIconName; className?: string }) {
  const Icon = icons[name];
  if (!Icon) return null;
  return (
    <Icon
      className={`stationery-icon ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
    />
  );
}
