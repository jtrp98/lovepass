import type { ReactNode } from "react";

export function GiftExperienceHeader({
  title = "เลือกของขวัญให้คนพิเศษ",
  subtitle = "เรื่องเล็ก ๆ ที่ทำให้ทุกวันน่ารักขึ้น",
  children,
}: {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="pocket-intro gift-shared-header">
      <div className="min-w-0">
        <p className="pocket-mono">
          <span className="pocket-foil" aria-hidden="true" />
          LITTLE GIFTS, LOTS OF LOVE
        </p>
        <h1 tabIndex={-1} className="gift-shared-title">
          {title}
        </h1>
        {subtitle && <p className="gift-shared-subtitle">{subtitle}</p>}
        {children}
      </div>
      <div className="pocket-seal" aria-hidden="true">
        <small>A LITTLE</small>
        <span>for you</span>
        <small>WITH LOVE</small>
      </div>
    </header>
  );
}
