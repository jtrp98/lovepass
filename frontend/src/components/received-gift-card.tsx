import { useId } from "react";
import { LuHeart, LuMail } from "react-icons/lu";
import type { ReceivedGift } from "@/types";
import { couponCategories, resolveCategory } from "@/lib/coupon-categories";
import { Button, formatDate, formatDateTime, rarityStyles } from "./ui";
import { RarityPips } from "./love-ticket";
import { TicketIllustration } from "./ticket-illustration";
import { StationeryIcon } from "./stationery";
import { defaultCouponDescription } from "@/lib/gift-share";

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
        <div className="pocket-topline">
          <span className="pocket-mono inline-flex items-center gap-1">
            {gift.openedAt ? (
              <>
                OPENED WITH LOVE <LuHeart className="inline-block h-3 w-3 text-love" aria-hidden="true" />
              </>
            ) : (
              <>
                UNOPENED GIFT <LuMail className="inline-block h-3 w-3 text-love" aria-hidden="true" />
              </>
            )}
          </span>
          <span className="sent-gift-sent">
            <span aria-hidden="true">♥</span> ได้รับจาก {gift.senderName}
          </span>
        </div>
        <h2 id={heading}>{gift.title || `ของขวัญรวม ${total} ใบ`}</h2>
        <p className="text-sm font-medium text-love">รวม {total} คำสัญญาสำหรับเธอ</p>
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
        {gift.coupons.map((coupon, index) => {
          const catKey = resolveCategory(coupon.category);
          const desc = coupon.description?.trim() || defaultCouponDescription(catKey, coupon.name);
          return (
            <li key={index} className="sent-gift-coupon pocket-detail" data-rarity={coupon.rarity}>
              <TicketIllustration category={coupon.category} />
              <div className="sent-gift-coupon-copy">
                <p className="pocket-category flex items-center gap-1.5">
                  <span>{couponCategories[catKey].label}</span>
                  <span>·</span>
                  <RarityPips rarity={coupon.rarity} />
                  <span>{rarityStyles[coupon.rarity].label.split(" · ")[0]}</span>
                </p>
                <h3>{coupon.name}</h3>
                <p className="text-sm text-muted">{desc}</p>
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
          );
        })}
      </ul>
      <footer className="sent-gift-footer flex-wrap items-center justify-between gap-2">
        <span>ความทรงจำและความสุขของสองเรา</span>
        <div className="flex items-center gap-2">
          {onOpenDetail && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onOpenDetail(gift)}
            >
              <StationeryIcon name="story" className="h-4 w-4 shrink-0" />
              ดูการ์ดของขวัญ & แชร์สตอรี่
            </Button>
          )}
          <span className="pocket-mono" aria-hidden="true">RECEIVED WITH LOVE.</span>
        </div>
      </footer>
    </article>
  );
}
