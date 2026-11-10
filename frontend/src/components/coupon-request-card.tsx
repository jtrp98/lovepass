import { useId, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { LuClock, LuCheck, LuMinus } from "react-icons/lu";
import type { Redemption } from "@/types";
import { couponCategories, resolveCategory } from "@/lib/coupon-categories";
import { TicketIllustration } from "./ticket-illustration";
import { RubberStamp } from "./rubber-stamp";
import { formatDate, formatDateTime, rarityStyles } from "./ui";

const statuses: Record<string, { label: string; icon: IconType }> = {
  PENDING: { label: "รอยืนยัน", icon: LuClock },
  APPROVED: { label: "ใช้แล้ว", icon: LuCheck },
  REJECTED: { label: "ปฏิเสธแล้ว", icon: LuMinus },
  CANCELLED: { label: "ยกเลิกแล้ว", icon: LuMinus },
};

/** Powers that hold the target coupon too while the request waits (see MetaCouponRules.ReservesTarget). */
const holdsTarget = new Set(["EXTEND", "FASTPASS", "UPGRADE"]);

export function CouponRequestCard({ item, direction, children, animateStamp = false }: {
  item: Redemption;
  direction: "received" | "sent";
  children?: ReactNode;
  animateStamp?: boolean;
}) {
  const heading = useId();
  const status = statuses[item.status] ?? { label: item.status, icon: LuClock };
  const StatusIcon = status.icon;
  return (
    <article className="pocket-ticket request-ticket" data-rarity={item.rarity} data-state={item.status === "APPROVED" ? "used" : item.status === "PENDING" ? "pending" : undefined} data-status={item.status} aria-labelledby={heading}>
      <div className="pocket-face">
        <div className="pocket-topline">
          <span className="pocket-mono pocket-admit">REQUEST SLIP <span aria-hidden="true">✦</span> RQ-{String(item.id).padStart(4, "0")}</span>
          <span className="request-status pocket-status">
            <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{status.label}</span>
          </span>
        </div>
        <div className="pocket-story request-story">
          <div>
            <p className="pocket-category">{couponCategories[resolveCategory(item.category)].label} · {rarityStyles[item.rarity].label.split(" · ")[0]}</p>
            <h2 id={heading}>{item.couponName}</h2>
            <p className="request-person">{direction === "received" ? `${item.requesterName} ขอใช้ใบนี้` : "คำขอที่ส่งให้แฟน"}</p>
            {item.targetName && <p className="request-person">ใช้กับ <strong>{item.targetName}</strong>{item.targetRarity && ` · ${rarityStyles[item.targetRarity]?.label.split(" · ")[0] ?? item.targetRarity}`}</p>}
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
          <span className="pocket-from">{item.status === "PENDING" ? `คำขอนี้กันคูปองไว้ ${item.effect && holdsTarget.has(item.effect) ? 2 : 1} ใบ` : item.status === "APPROVED" ? "อีกหนึ่งความทรงจำของเรา" : "คืนสิทธิ์คูปองแล้ว"}</span>
          <span className="pocket-quantity-note">
            {item.status === "APPROVED" ? (
              item.resolvedAt ? (
                <>ใช้สำเร็จเมื่อ <time dateTime={item.resolvedAt}>{formatDate(item.resolvedAt)}</time></>
              ) : (
                "ใช้สำเร็จแล้ว เป็นความทรงจำ"
              )
            ) : (
              <>ใช้ได้ถึง <time dateTime={item.couponExpiresAt}>{formatDate(item.couponExpiresAt)}</time></>
            )}
          </span>
        </div>
        {children && <div className="request-actions">{children}</div>}
      </div>
    </article>
  );
}
