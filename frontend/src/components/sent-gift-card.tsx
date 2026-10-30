import { useId } from "react";
import type { SentGift } from "@/types";
import { couponCategories, resolveCategory } from "@/lib/coupon-categories";
import { formatDate, formatDateTime, rarityStyles } from "./ui";
import { TicketIllustration } from "./ticket-illustration";

export function SentGiftCard({ gift }: { gift: SentGift }) {
  const heading = useId();
  const total = gift.coupons.reduce((sum, coupon) => sum + coupon.quantity, 0);
  return (
    <article className="pocket-ticket sent-gift-sheet" aria-labelledby={heading}>
      <header className="pocket-face sent-gift-header">
        <div className="pocket-topline">
          <span className="pocket-mono">GIFT NOTE / GF-{String(gift.id).padStart(4, "0")}</span>
          <span className="sent-gift-sent"><span aria-hidden="true">♡</span> มอบให้แล้ว</span>
        </div>
        <h2 id={heading}>ส่งความรักไป {total} ใบ</h2>
        <p className="sent-gift-date">มอบเมื่อ <time dateTime={gift.createdAt}>{formatDateTime(gift.createdAt)}</time></p>
        {gift.message && <blockquote className="sent-gift-note"><p>{gift.message}</p></blockquote>}
      </header>
      <div className="pocket-perforation" aria-hidden="true" />
      <ul className="sent-gift-coupons" aria-label="คูปองในของขวัญชุดนี้">
        {gift.coupons.map((coupon, index) => (
          <li key={index} className="sent-gift-coupon pocket-detail" data-rarity={coupon.rarity}>
            <TicketIllustration category={coupon.category} />
            <div className="sent-gift-coupon-copy">
              <p className="pocket-category">{couponCategories[resolveCategory(coupon.category)].label} · {rarityStyles[coupon.rarity].label.split(" · ")[0]}</p>
              <h3>{coupon.name}</h3>
              <p className="sent-gift-count">มอบ {coupon.quantity} ใบ <span aria-hidden="true">·</span> คงเหลือ {coupon.remaining} ใบ</p>
              <p className="sent-gift-expiry">หมดอายุ <time dateTime={coupon.expiresAt}>{formatDate(coupon.expiresAt)}</time></p>
            </div>
          </li>
        ))}
      </ul>
      <footer className="sent-gift-footer"><span>คำสัญญาเล็ก ๆ ที่เราเคยให้กัน</span><span className="pocket-mono" aria-hidden="true">SENT WITH LOVE.</span></footer>
    </article>
  );
}
