"use client";

import { useId, type ReactNode } from "react";
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
export function LoveTicket({ ticket, onOpen, catalog = false }: {
  ticket: LoveTicketData;
  onOpen: () => void;
  catalog?: boolean;
}) {
  const heading = useId();
  const action = catalog ? "เปิดดูใบนี้" : ticket.state === "available" ? "เปิดใช้สิทธิ์" : "เปิดดูความทรงจำ";
  return (
    <article className="pocket-ticket" data-rarity={ticket.rarity} data-state={ticket.state} aria-labelledby={heading}>
      <div className="pocket-face">
        <div className="pocket-topline">
          <span className="pocket-mono">LOVE PASS <span aria-hidden="true">/</span> {ticket.id}</span>
          <span className="pocket-status"><span aria-hidden="true">{ticket.state === "available" ? "●" : ticket.state === "pending" ? "◷" : ticket.state === "used" ? "✓" : "⊘"}</span> {catalog ? "แด่คนพิเศษ" : statuses[ticket.state]}</span>
        </div>
        <div className="pocket-story">
          <div>
            <p className="pocket-category">{couponCategories[resolveCategory(ticket.category)].label} <span aria-hidden="true">·</span> {rarityStyles[ticket.rarity].label.split(" · ")[0]}</p>
            <h2 id={heading}>{ticket.name}</h2>
            <p className="pocket-note">{ticket.note}</p>
          </div>
          <TicketIllustration category={ticket.category} />
        </div>
        <div className="pocket-validity">
          {ticket.expiresAt ? <time dateTime={ticket.expiresAt}>{ticket.state === "expired" ? "หมดอายุ" : "ใช้ได้ถึง"} {formatDate(ticket.expiresAt)}</time> : <span>คำสัญญาเล็ก ๆ สำหรับเราสองคน</span>}
          <span className="pocket-edition" aria-hidden="true">a little love, to keep.</span>
        </div>
      </div>
      <div className="pocket-perforation" aria-hidden="true" />
      <div className="pocket-stub">
        <div className="pocket-stub-copy">
          {ticket.state === "used" && <RubberStamp date={ticket.redeemedAt} />}
          {catalog ? <><span className="pocket-from">เขียนให้เธอ ด้วยความรัก</span><span className="pocket-quantity-note">เปิดอ่านรายละเอียดก่อนเลือกให้แฟน</span></> : <>
            <span className="pocket-from">จาก {ticket.from ?? "คนที่รักเธอ"}</span>
            <span className="pocket-quantity-note">{ticket.state === "available" ? `คูปองพร้อมใช้ ${ticket.quantity ?? 1} ใบ` : ticket.state === "pending" ? `คูปองรอยืนยัน ${ticket.reserved ?? 1} ใบ` : "เก็บใบนี้ไว้ เป็นความทรงจำ"}{ticket.state === "available" && !!ticket.reserved && ` · รอยืนยัน ${ticket.reserved} ใบ`}</span>
          </>}
        </div>
        <button type="button" className="pocket-action" onClick={onOpen} aria-label={`${action} ${ticket.name}`}>
          {action} <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  );
}

export function TicketDetail({ ticket, children }: { ticket: LoveTicketData; children?: ReactNode }) {
  return (
    <div className="pocket-detail" data-rarity={ticket.rarity} data-state={ticket.state}>
      <div className="pocket-detail-note">
        <TicketIllustration category={ticket.category} />
        <p className="pocket-note">{ticket.note}</p>
        <span className="pocket-mono">LOVE PASS / {ticket.id}</span>
      </div>
      <dl className="pocket-facts">
        <div><dt>หมวดหมู่</dt><dd>{couponCategories[resolveCategory(ticket.category)].label}</dd></div>
        <div><dt>จาก</dt><dd>{ticket.from ?? "คนที่รักเธอ"}</dd></div>
        {ticket.to && <div><dt>ถึง</dt><dd>{ticket.to}</dd></div>}
        <div><dt>สถานะ</dt><dd>{statuses[ticket.state]}</dd></div>
        {ticket.quantity !== undefined && <div><dt>จำนวนคูปอง</dt><dd>{ticket.quantity} ใบพร้อมใช้{ticket.reserved ? ` · ${ticket.reserved} ใบรอยืนยัน` : ""}</dd></div>}
        {ticket.expiresAt && <div><dt>วันหมดอายุ</dt><dd><time dateTime={ticket.expiresAt}>{formatDate(ticket.expiresAt)}</time></dd></div>}
      </dl>
      {ticket.terms && <p className="pocket-terms">เงื่อนไข: {ticket.terms}</p>}
      {/กอด/.test(ticket.name) && <p className="pocket-clarification">จำนวนใบคือจำนวนคูปองที่ได้รับ ส่วนกอดได้แค่ไหน ให้ยึดตามคำสัญญาและเงื่อนไขบนใบนี้นะ</p>}
      {children}
    </div>
  );
}
