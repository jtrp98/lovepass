"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import type { Rarity } from "@/types";
import { formatDate, rarityStyles } from "./ui";
import { TicketIllustration } from "./ticket-illustration";
import { RubberStamp } from "./rubber-stamp";
import { couponCategories, resolveCategory, type CouponCategory } from "@/lib/coupon-categories";

export type TicketState = "available" | "pending" | "used" | "expired";
export interface LoveTicketData {
  id: string;
  name: string;
  note: string;
  terms?: string;
  rarity: Rarity;
  category?: CouponCategory;
  state: TicketState;
  quantity?: number;
  reserved?: number;
  expiresAt?: string;
  redeemedAt?: string;
  from?: string;
  to?: string;
}
const statuses: Record<TicketState, string> = {
  available: "พร้อมใช้", pending: "รอแฟนยืนยัน", used: "ใช้แล้ว", expired: "หมดอายุแล้ว",
};
const pips: Record<Rarity, number> = { COMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4, MYTHIC: 5 };
const maxPips = Math.max(...Object.values(pips));

/** Printed hearts that count rarity; the rarity name beside them is the readable label. */
export function RarityPips({ rarity }: { rarity: Rarity }) {
  return (
    <span className="rarity-pips" aria-hidden="true">
      {Array.from({ length: maxPips }, (_, index) => (
        <svg key={index} viewBox="0 0 12 11" data-filled={index < pips[rarity] || undefined}>
          <path d="M6 10S1 6.9 1 3.7C1 1.2 4.4.5 6 3c1.6-2.5 5-1.8 5 .7C11 6.9 6 10 6 10Z" />
        </svg>
      ))}
    </span>
  );
}

function StatusMark({ state }: { state: TicketState }) {
  return (
    <svg className="status-mark" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {state === "available" ? <path d="M8 13.4S2.6 10.2 2.6 6.6C2.6 4 6.2 3.2 8 5.8c1.8-2.6 5.4-1.8 5.4.8 0 3.6-5.4 6.8-5.4 6.8Z" fill="currentColor" />
        : state === "pending" ? <><circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M8 4.8V8l2.2 1.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></>
        : state === "used" ? <path d="m3.4 8.4 3 3 6.2-6.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        : <><circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="m4.2 11.8 7.6-7.6" stroke="currentColor" strokeWidth="1.4" /></>}
    </svg>
  );
}

export function LoveTicket({ ticket, onOpen, catalog = false, open = false, onClose, animateStamp = false, children }: {
  ticket: LoveTicketData;
  onOpen: () => void;
  catalog?: boolean;
  /** Unfolded in place: fine print on the face, `children` become the stub. */
  open?: boolean;
  onClose?: () => void;
  animateStamp?: boolean;
  children?: ReactNode;
}) {
  const heading = useId();
  const root = useRef<HTMLElement>(null);
  const wasOpen = useRef(open);
  const action = catalog ? "เปิดดูใบนี้" : ticket.state === "available" ? "เปิดใช้สิทธิ์" : "เปิดดูความทรงจำ";
  useEffect(() => {
    const article = root.current;
    if (!article || open === wasOpen.current) return;
    wasOpen.current = open;
    if (open) {
      article.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
      article.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    } else article.querySelector<HTMLElement>(".pocket-action")?.focus();
  }, [open]);
  return (
    <article ref={root} className="pocket-ticket love-ticket" data-rarity={ticket.rarity} data-state={ticket.state} data-open={open || undefined} aria-labelledby={heading}
      onKeyDown={open ? (event) => { if (event.key === "Escape") { event.stopPropagation(); onClose?.(); } } : undefined}>
      {ticket.state === "pending" && <PaperClip />}
      <div className="pocket-face">
        <div className="pocket-topline">
          <span className="pocket-mono pocket-admit">LOVE PASS <span aria-hidden="true">✦</span> ADMIT TWO</span>
          <span className="pocket-serial"><span className="sr-only">เลขที่ </span><i aria-hidden="true">No.</i> {ticket.id}</span>
        </div>
        <div className="pocket-story">
          <div>
            <p className="pocket-category">{couponCategories[resolveCategory(ticket.category)].label} <span aria-hidden="true">·</span> <RarityPips rarity={ticket.rarity} /> {rarityStyles[ticket.rarity].label.split(" · ")[0]}</p>
            <h2 id={heading} tabIndex={open ? -1 : undefined}>{ticket.name}</h2>
            <p className="pocket-note">{ticket.note}</p>
          </div>
          <div className="pocket-emblem">
            <TicketIllustration category={ticket.category} />
            {ticket.state === "used" && <RubberStamp date={ticket.redeemedAt} animate={animateStamp} />}
          </div>
        </div>
        {open && <TicketFinePrint ticket={ticket} catalog={catalog} />}
        <div className="pocket-validity">
          {ticket.expiresAt ? <time dateTime={ticket.expiresAt}>{ticket.state === "expired" ? "หมดอายุ" : "ใช้ได้ถึง"} {formatDate(ticket.expiresAt)}</time> : <span>คำสัญญาเล็ก ๆ สำหรับเราสองคน</span>}
          <span className="pocket-status"><StatusMark state={ticket.state} /> {catalog ? "แด่คนพิเศษ" : statuses[ticket.state]}</span>
        </div>
      </div>
      <div className="pocket-perforation" aria-hidden="true" />
      <div className="pocket-stub">
        {open ? <div className="pocket-stub-open">
          {children}
          <button type="button" className="ticket-fold" onClick={onClose}>พับเก็บ <span aria-hidden="true">↑</span></button>
        </div> : <div className="pocket-stub-copy">
          <span className="pocket-mono pocket-stub-serial" aria-hidden="true">STUB · NO. {ticket.id}</span>
          {catalog ? <><span className="pocket-from">เขียนให้เธอ ด้วยความรัก</span><span className="pocket-quantity-note">เปิดอ่านรายละเอียดก่อนเลือกให้แฟน</span></> : <>
            <span className="pocket-from">จาก {ticket.from ?? "คนที่รักเธอ"}</span>
            <span className="pocket-quantity-note">{ticket.state === "available" ? `คูปองพร้อมใช้ ${ticket.quantity ?? 1} ใบ` : ticket.state === "pending" ? `คูปองรอยืนยัน ${ticket.reserved ?? 1} ใบ` : "เก็บใบนี้ไว้ เป็นความทรงจำ"}{ticket.state === "available" && !!ticket.reserved && ` · รอยืนยัน ${ticket.reserved} ใบ`}</span>
          </>}
        </div>}
      </div>
      {/* Outside the masked stub so its ::after can make the whole ticket tappable. */}
      {!open && <button type="button" className="pocket-action" onClick={onOpen} aria-label={`${action} ${ticket.name}`}>
        {action} <span aria-hidden="true">↗</span>
      </button>}
    </article>
  );
}

/** A steel clip holding a ticket that is waiting for the partner's answer. */
export function PaperClip() {
  return (
    <svg className="paper-clip" viewBox="0 0 22 60" aria-hidden="true" focusable="false">
      <path d="M7 40V12a5 5 0 0 1 10 0v34a7.5 7.5 0 0 1-15 0V16" fill="none" stroke="#8c8790" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M7 40V12a5 5 0 0 1 10 0v34a7.5 7.5 0 0 1-15 0V16" fill="none" stroke="#e9e6ec" strokeWidth=".8" strokeLinecap="round" transform="translate(-.5 -.5)" />
    </svg>
  );
}

/** The ticket's small print, shown on the face when it is unfolded. */
export function TicketFinePrint({ ticket, catalog = false }: { ticket: LoveTicketData; catalog?: boolean }) {
  return (
    <div className="pocket-fineprint">
      <p className="pocket-mono" aria-hidden="true">— TERMS OF THIS LITTLE PROMISE —</p>
      <dl>
        <div><dt>หมวดหมู่</dt><dd>{couponCategories[resolveCategory(ticket.category)].label}</dd></div>
        {!catalog && <div><dt>จาก</dt><dd>{ticket.from ?? "คนที่รักเธอ"}</dd></div>}
        {ticket.to && <div><dt>ถึง</dt><dd>{ticket.to}</dd></div>}
        {!catalog && <div><dt>สถานะ</dt><dd>{statuses[ticket.state]}</dd></div>}
        {ticket.quantity !== undefined && <div><dt>จำนวนคูปอง</dt><dd>{ticket.quantity} ใบพร้อมใช้{ticket.reserved ? ` · ${ticket.reserved} ใบรอยืนยัน` : ""}</dd></div>}
        {ticket.expiresAt && <div><dt>วันหมดอายุ</dt><dd><time dateTime={ticket.expiresAt}>{formatDate(ticket.expiresAt)}</time></dd></div>}
      </dl>
      {ticket.terms && <p className="pocket-terms">เงื่อนไข: {ticket.terms}</p>}
      {/กอด/.test(ticket.name) && <p className="pocket-clarification">จำนวนใบคือจำนวนคูปองที่ได้รับ ส่วนกอดได้แค่ไหน ให้ยึดตามคำสัญญาและเงื่อนไขบนใบนี้นะ</p>}
    </div>
  );
}
