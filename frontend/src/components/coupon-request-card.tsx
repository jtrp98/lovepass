import { useId, type ReactNode } from "react";
import type { Redemption } from "@/types";
import { couponCategories, resolveCategory } from "@/lib/coupon-categories";
import { TicketIllustration } from "./ticket-illustration";
import { RubberStamp } from "./rubber-stamp";
import { formatDate, formatDateTime, rarityStyles } from "./ui";

const statuses = {
  PENDING: { label: "รอยืนยัน", symbol: "◷" },
  APPROVED: { label: "ใช้แล้ว", symbol: "✓" },
  REJECTED: { label: "ปฏิเสธแล้ว", symbol: "—" },
  CANCELLED: { label: "ยกเลิกแล้ว", symbol: "—" },
};

export function CouponRequestCard({ item, direction, children, animateStamp = false }: {
  item: Redemption;
  direction: "received" | "sent";
  children?: ReactNode;
  animateStamp?: boolean;
}) {
  const heading = useId();
  const status = statuses[item.status];
  return (
    <article className="pocket-ticket request-ticket" data-rarity={item.rarity} data-state={item.status === "APPROVED" ? "used" : item.status === "PENDING" ? "pending" : undefined} data-status={item.status} aria-labelledby={heading}>
      <div className="pocket-face">
        <div className="pocket-topline">
          <span className="pocket-mono pocket-admit">REQUEST SLIP <span aria-hidden="true">✦</span> RQ-{String(item.id).padStart(4, "0")}</span>
          <span className="request-status pocket-status"><span aria-hidden="true">{status.symbol}</span><span>{status.label}</span></span>
        </div>
        <div className="pocket-story request-story">
          <div>
            <p className="pocket-category">{couponCategories[resolveCategory(item.category)].label} · {rarityStyles[item.rarity].label.split(" · ")[0]}</p>
            <h2 id={heading}>{item.couponName}</h2>
            <p className="request-person">{direction === "received" ? `${item.requesterName} ขอใช้ใบนี้` : "คำขอที่ส่งให้แฟน"}</p>
          </div>
          <div className="pocket-emblem">
            <TicketIllustration category={item.category} />
            {item.status === "APPROVED" && <RubberStamp date={item.resolvedAt} animate={animateStamp} />}
          </div>
        </div>
        {item.message && <blockquote className="request-note"><p>{item.message}</p></blockquote>}
        <div className="request-dates">
          <p>ส่งเมื่อ <time dateTime={item.requestedAt}>{formatDateTime(item.requestedAt)}</time></p>
          {item.resolvedAt && <p>ตอบกลับเมื่อ <time dateTime={item.resolvedAt}>{formatDateTime(item.resolvedAt)}</time></p>}
        </div>
      </div>
      <div className="pocket-perforation" aria-hidden="true" />
      <div className="pocket-stub request-stub">
        <div className="pocket-stub-copy">
          <span className="pocket-from">{item.status === "PENDING" ? "คำขอนี้กันคูปองไว้ 1 ใบ" : item.status === "APPROVED" ? "อีกหนึ่งความทรงจำของเรา" : "คืนสิทธิ์คูปองแล้ว"}</span>
          <span className="pocket-quantity-note">ใช้ได้ถึง <time dateTime={item.couponExpiresAt}>{formatDate(item.couponExpiresAt)}</time></span>
        </div>
        {children && <div className="request-actions">{children}</div>}
      </div>
    </article>
  );
}
