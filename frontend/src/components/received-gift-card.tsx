import { useId } from "react";
import type { ReceivedGift } from "@/types";
import { couponCategories, resolveCategory } from "@/lib/coupon-categories";
import { Button, formatDate, formatDateTime, rarityStyles } from "./ui";
import { RarityPips } from "./love-ticket";
import { TicketIllustration } from "./ticket-illustration";
import { StationeryIcon } from "./stationery";

export function ReceivedGiftCard({
  gift,
  onOpenDetail,
}: {
  gift: ReceivedGift;
  onOpenDetail?: (gift: ReceivedGift) => void;
}) {
  const heading = useId();
  const total = gift.coupons.reduce((sum, coupon) => sum + coupon.quantity, 0);

  return (
    <article className="pocket-ticket sent-gift-sheet" aria-labelledby={heading}>
      <header className="pocket-face sent-gift-header">
        <span className="postage-mark" aria-hidden="true" />
        <div className="pocket-topline">
          <span className="pocket-mono">AIRMAIL · PAR AVION / GF-{String(gift.id).padStart(4, "0")}</span>
          <span className="sent-gift-sent">
            <span aria-hidden="true">♥</span> ได้รับจาก {gift.senderName}
          </span>
        </div>
        <h2 id={heading}>{gift.title || `ของขวัญรวม ${total} ใบ`}</h2>
        {gift.title && <p className="text-sm font-medium text-love">รวมคูปอง {total} ใบจากใจ</p>}
        <p className="sent-gift-date">
          ได้รับเมื่อ <time dateTime={gift.createdAt}>{formatDateTime(gift.createdAt)}</time>
        </p>
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
              <p className="pocket-category flex items-center gap-1.5">
                <span>{couponCategories[resolveCategory(coupon.category)].label}</span>
                <span>·</span>
                <RarityPips rarity={coupon.rarity} />
                <span>{rarityStyles[coupon.rarity].label.split(" · ")[0]}</span>
              </p>
              <h3>{coupon.name}</h3>
              {coupon.description && <p className="text-sm text-muted">{coupon.description}</p>}
              <p className="sent-gift-count">
                ได้รับ {coupon.quantity} ใบ <span aria-hidden="true">·</span>{" "}
                {coupon.remaining === 0 ? "ใช้หมดแล้ว ♥" : `คงเหลือ ${coupon.remaining} ใบ`}
              </p>
              {coupon.remaining > 0 && (
                <p className="sent-gift-expiry">
                  หมดอายุ <time dateTime={coupon.expiresAt}>{formatDate(coupon.expiresAt)}</time>
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <footer className="sent-gift-footer flex-wrap items-center justify-between gap-2">
        <span>คำสัญญาและความใส่ใจจากคนที่รักคุณ</span>
        <div className="flex items-center gap-2">
          {onOpenDetail && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onOpenDetail(gift)}
            >
              <StationeryIcon name="letter" className="h-4 w-4 shrink-0" />
              ดูการ์ดของขวัญ & แชร์สตอรี่
            </Button>
          )}
          <span className="pocket-mono" aria-hidden="true">RECEIVED WITH LOVE.</span>
        </div>
      </footer>
    </article>
  );
}
