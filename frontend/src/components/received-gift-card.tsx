import { useId } from "react";
import type { ReceivedGift } from "@/types";
import { couponCategories, resolveCategory } from "@/lib/coupon-categories";
import { formatDate, formatDateTime, rarityStyles } from "./ui";
import { TicketIllustration } from "./ticket-illustration";

export function ReceivedGiftCard({ gift }: { gift: ReceivedGift }) {
  const heading = useId();
  const total = gift.coupons.reduce((sum, coupon) => sum + coupon.quantity, 0);
  return (
    <article className="pocket-ticket sent-gift-sheet" aria-labelledby={heading}>
      <header className="pocket-face sent-gift-header">
        <span className="postage-mark" aria-hidden="true" />
        <div className="pocket-topline">
          <span className="pocket-mono">AIRMAIL · PAR AVION / GF-{String(gift.id).padStart(4, "0")}</span>
          <span className="sent-gift-sent"><span aria-hidden="true">♥</span> ได้รับจาก {gift.senderName}</span>
        </div>
        <h2 id={heading}>{gift.title || `ของขวัญรวม ${total} ใบ`}</h2>
        {gift.title && <p className="text-sm font-medium text-love">รวมคูปอง {total} ใบจากใจ</p>}
        <p className="sent-gift-date">ได้รับเมื่อ <time dateTime={gift.createdAt}>{formatDateTime(gift.createdAt)}</time></p>
        {gift.message && (
          <blockquote className="sent-gift-note">
            <p className="whitespace-pre-wrap">{gift.message}</p>
          </blockquote>
        )}
      </header>
      <div className="pocket-perforation" aria-hidden="true" />
      <ul className="sent-gift-coupons" aria-label="คูปองในของขวัญชุดนี้">
        {gift.coupons.map((coupon, index) => (
          <li key={index} className="sent-gift-coupon pocket-detail" data-rarity={coupon.rarity}>
            <TicketIllustration category={coupon.category} />
            <div className="sent-gift-coupon-copy">
              <p className="pocket-category">
                {couponCategories[resolveCategory(coupon.category)].label} · {rarityStyles[coupon.rarity].label.split(" · ")[0]}
              </p>
              <h3>{coupon.name}</h3>
              {coupon.description && <p className="text-sm text-muted">{coupon.description}</p>}
              <p className="sent-gift-count">
                ได้รับ {coupon.quantity} ใบ <span aria-hidden="true">·</span>{" "}
                {coupon.remaining === 0 ? "ใช้หมดแล้ว ♥" : `คงเหลือ ${coupon.remaining} ใบ`}
              </p>
              {coupon.remaining > 0 && (
                <p className="sent-gift-expiry">หมดอายุ <time dateTime={coupon.expiresAt}>{formatDate(coupon.expiresAt)}</time></p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <footer className="sent-gift-footer">
        <span>คำสัญญาและความใส่ใจจากคนที่รักคุณ</span>
        <span className="pocket-mono" aria-hidden="true">RECEIVED WITH LOVE.</span>
      </footer>
    </article>
  );
}
