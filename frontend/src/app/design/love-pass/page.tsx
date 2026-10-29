"use client";

import Link from "next/link";
import { useState } from "react";
import { LoveTicket, TicketDetail, type LoveTicketData, type TicketState } from "@/components/love-ticket";
import { TicketRequest } from "@/components/ticket-request";
import { Button, Dialog, Field, Select, rarityStyles } from "@/components/ui";
import { couponCategories } from "@/lib/coupon-categories";
import { TicketIllustration } from "@/components/ticket-illustration";
import { RedemptionReceipt } from "@/components/redemption-receipt";
import type { Rarity } from "@/types";

const hug: LoveTicketData = {
  category: "AFFECTION",
  id: "LP-0014", name: "ตั๋วกอดไม่อั้น", note: "เหนื่อยเมื่อไหร่ ก็มากอดกันนะ ♡", terms: "กอดได้ไม่จำกัดครั้งจนถึงวันหมดอายุ เลือกเวลาที่เราทั้งคู่พร้อมเสมอนะ", rarity: "COMMON", state: "available", quantity: 1, expiresAt: "2026-11-29T16:59:59Z", from: "เจ", to: "เธอคนโปรด",
};
const wish: LoveTicketData = {
  category: "WISH",
  id: "LP-0015", name: "ตั๋วขอพร 1 ข้อ", note: "ขอมาได้หนึ่งอย่าง เราจะตั้งใจฟังเลย", terms: "คูปอง 1 ใบ ขอพรได้ 1 ข้อ ตกลงสิ่งที่เราทั้งคู่สบายใจก่อนใช้", rarity: "EPIC", state: "available", quantity: 2, expiresAt: "2026-11-29T16:59:59Z", from: "เจ", to: "เธอคนโปรด",
};
const initial: LoveTicketData[] = [hug, wish,
  { ...hug, id: "LP-0008", state: "used", quantity: 0 },
  { ...wish, id: "LP-0009", state: "used", quantity: 0 },
  { ...hug, id: "LP-0002", state: "expired", quantity: 0, expiresAt: "2026-09-29T16:59:59Z" },
  { ...wish, id: "LP-0003", state: "expired", quantity: 0, expiresAt: "2026-09-29T16:59:59Z" },
];

export default function LovePassDesign() {
  const [tickets, setTickets] = useState(initial);
  const [view, setView] = useState<TicketState>("available");
  const [selected, setSelected] = useState<LoveTicketData | null>(null);
  const [justUsed, setJustUsed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [iconTier, setIconTier] = useState<Rarity>("EPIC");
  function open(ticket: LoveTicketData) { setSelected(ticket); setJustUsed(false); }
  function request() {
    if (!selected || selected.state !== "available") return;
    const pending = { ...selected, id: `${selected.id}-R`, state: "pending" as const, quantity: 0, reserved: 1 };
    setTickets((items) => items.flatMap((item) => item.id !== selected.id ? [item] : (item.quantity ?? 0) > 1 ? [{ ...item, quantity: item.quantity! - 1 }, pending] : [pending]));
    setSelected(pending);
    setAnnouncement("ส่งคำขอตัวอย่างแล้ว รอแฟนยืนยัน");
  }
  function approve() {
    if (!selected || selected.state !== "pending") return;
    const used = { ...selected, state: "used" as const, reserved: 0 };
    setTickets((items) => items.map((item) => item.id === used.id ? used : item));
    setSelected(used);
    setJustUsed(true);
    setAnnouncement("แฟนยืนยันแล้ว เก็บตั๋วใบนี้ไว้ในความทรงจำ");
  }
  const visible = tickets.filter((ticket) => ticket.state === view);
  return (
    <div className="pocket-studio">
      <a href="#collection" className="sr-only focus:not-sr-only">ข้ามไปสมุดตั๋ว</a>
      <header className="pocket-studio-header">
        <Link href="/design/love-pass" className="pocket-wordmark"><span aria-hidden="true">♡</span> LOVE PASS</Link>
        <a href="#directions">เบื้องหลังตั๋วใบเล็ก <span aria-hidden="true">↗</span></a>
      </header>
      <main className="pocket-studio-main pocket-book">
        <header className="pocket-intro">
          <div>
            <p className="pocket-mono"><span className="pocket-foil" aria-hidden="true" />THE POCKET EDITION — VOL. 01</p>
            <h1>คำสัญญาใบเล็ก ๆ<br />ที่เก็บไว้ใกล้ใจ</h1>
            <p>ไม่ใช่วันพิเศษ ก็ให้ความรักกันได้นะ</p>
          </div>
          <div className="pocket-seal" aria-hidden="true"><small>MADE FOR</small><span>you & me</span><small>WITH LOVE</small></div>
        </header>
        <p className="pocket-demo-note">สมุดตัวอย่าง · ลองเปิดและขอใช้ได้ โดยไม่ส่งคำขอจริง</p>
        <section id="collection" aria-label="สมุดตั๋วตัวอย่าง">
          <div className="status-tabs" role="group" aria-label="สถานะตั๋วตัวอย่าง">
            {([{ id: "available", label: "พร้อมใช้" }, { id: "pending", label: "รอยืนยัน" }, { id: "used", label: "ใช้แล้ว เก็บไว้" }, { id: "expired", label: "หมดอายุ" }] as const).map((tab) => <button key={tab.id} className="status-tab" aria-pressed={view === tab.id} onClick={() => setView(tab.id)}>{tab.label} <span className="pocket-mono">{String(tickets.filter((item) => item.state === tab.id).length).padStart(2, "0")}</span></button>)}
          </div>
          <div className="pocket-collection-caption"><p>{view === "available" ? "จาก เจ · ถึง เธอคนโปรด" : view === "pending" ? "รออีกคนตอบรับคำสัญญา" : "บางใบใช้ไปแล้ว แต่ความรู้สึกยังอยู่"}</p><span className="pocket-mono">FOR TWO, ALWAYS.</span></div>
          <div className="pocket-collection" style={{ marginTop: 16 }}>
            {visible.map((ticket) => <LoveTicket key={ticket.id} ticket={ticket} onOpen={() => open(ticket)} />)}
          </div>
          {!visible.length && <p className="pocket-demo-note">ยังไม่มีตั๋วในหน้านี้ ลองเปิดใบที่พร้อมใช้ก่อนได้นะ</p>}
          <p className="sr-only" role="status">{announcement}</p>
        </section>
        <footer className="pocket-book-footer"><span>ความรักเป็นสิ่งเล็ก ๆ ที่เราตั้งใจให้กัน</span><button type="button" className="status-tab" onClick={() => { setTickets(initial); setView("available"); setAnnouncement("เริ่มสมุดตัวอย่างใหม่แล้ว"); }}>เริ่มลองใหม่ <span aria-hidden="true">↺</span></button></footer>
        <section className="pocket-exploration" id="categories" aria-labelledby="categories-title">
          <p className="pocket-mono">ONE CATEGORY, ONE LITTLE DRAWING</p>
          <h2 id="categories-title">รูปเล็ก ๆ แทนคำสัญญาแต่ละแบบ</h2>
          <p>ใช้รูปตามหมวด แล้วเปลี่ยนสีตามระดับความพิเศษ รูปเดิมก็เล่าความรู้สึกได้หลายแบบ</p>
          <div className="category-tier-select"><Field label="ลองเปลี่ยนระดับความพิเศษ"><Select value={iconTier} onChange={(e) => setIconTier(e.target.value as Rarity)}>{Object.entries(rarityStyles).map(([value, style]) => <option value={value} key={value}>{style.label}</option>)}</Select></Field></div>
          <div className="category-icon-grid">
            {Object.entries(couponCategories).map(([category, info]) => <a key={category} href={info.icon} download className="category-icon-sample pocket-detail" data-rarity={iconTier}>
              <TicketIllustration category={category} /><strong>{info.label}</strong><span>ดาวน์โหลด SVG <span aria-hidden="true">↓</span></span>
            </a>)}
          </div>
        </section>
        <section className="pocket-exploration" id="directions" aria-labelledby="directions-title">
          <p className="pocket-mono">THREE WAYS TO SAY “I LOVE YOU”</p>
          <h2 id="directions-title">ความรู้สึกเดียวกัน เล่าได้สามแบบ</h2>
          <p>เลือกแบบ A เป็นหน้าตาของสมุดตั๋ว แล้วเก็บประกายเล็ก ๆ จากแบบ C ไว้ในรายละเอียด</p>
          <div className="pocket-concepts">
            <article className="pocket-concept">
              <div className="pocket-concept-art"><div className="pocket-mini-ticket"><span className="pocket-mono">LOVE PASS / 0014</span><strong>ตั๋วกอดไม่อั้น</strong><p>เหนื่อยเมื่อไหร่ ก็มากอดกันนะ ♡</p><div>จาก เจ <span aria-hidden="true">—</span> สำหรับเธอคนโปรด</div></div></div>
              <h3>A / POCKET LOVE TICKET · SELECTED</h3><p>เหมือนตั๋วที่แอบใส่ไว้ในกระเป๋า อบอุ่น อ่านง่าย หยิบใช้ได้ทุกวัน ต้องคุมรอยปรุและลายกระดาษให้เบาพอดี</p>
            </article>
            <article className="pocket-concept">
              <div className="pocket-concept-art"><div className="pocket-receipt"><span>LOVE DISPENSER / NO. 02</span><strong>กอดอุ่น ๆ 1 ที่</strong><p><span>30.10.26</span><span>09:41</span></p><p><span>TOTAL</span><span>ALL MY LOVE</span></p><small>รับความรักแล้ว ยิ้มหน่อยนะ</small></div></div>
              <h3>B / LOVE RECEIPT MACHINE</h3><p>ใบเสร็จจากเครื่องพิมพ์ความรัก ขี้เล่น ชวนเซอร์ไพรส์ แต่รูปทรงยาวและภาษาการซื้อขายอาจลดความรู้สึกของของขวัญ</p>
            </article>
            <article className="pocket-concept">
              <div className="pocket-concept-art"><div className="pocket-keepsake"><span className="pocket-foil" aria-hidden="true" /><span className="pocket-mono">KEEPSAKE / 0015</span><strong>พรหนึ่งข้อของเธอ</strong><p>เก็บดาวดวงนี้ไว้ขออะไรก็ได้</p><span className="pocket-mono">A LITTLE PIECE OF US.</span></div></div>
              <h3>C / DIGITAL LOVE KEEPSAKE</h3><p>กระดาษซ้อนชั้นกับฟอยล์เล็ก ๆ ล้ำค่า ร่วมสมัย เหมาะกับใบพิเศษ แต่ประกายและมิติที่มากไปจะรบกวนการใช้ประจำวัน</p>
            </article>
          </div>
        </section>
      </main>
      {selected && <Dialog title={selected.name} className="ticket-dialog" onClose={() => setSelected(null)}>
        {selected.state === "used" ? <div className="pocket-success">
          <RedemptionReceipt ticket={selected} />
          <p className="pocket-demo-note">นี่คือการจำลองในสมุดตัวอย่าง</p>
          <div className="pocket-dialog-actions"><Button onClick={() => { setSelected(null); if (justUsed) setView("used"); }}>{justUsed ? "เก็บเข้าความทรงจำ" : "เก็บใบเสร็จไว้"}</Button></div>
        </div> : <TicketDetail ticket={selected}>
          {selected.state === "available" ? <TicketRequest name={selected.name} busy={false} onConfirm={request} onClose={() => setSelected(null)} /> : selected.state === "pending" ? <>
            <p className="pocket-terms">ส่งคำขอตัวอย่างแล้ว ในแอปจริงต้องรออีกคนยืนยัน</p>
            <div className="pocket-dialog-actions"><Button variant="secondary" onClick={() => setSelected(null)}>ปิด</Button><Button onClick={approve}>จำลองแฟนยืนยัน</Button></div>
          </> : <><p className="pocket-terms">{selected.state === "expired" ? "เลยวันที่สัญญาไว้แล้ว แต่ความรู้สึกดี ๆ ยังเก็บไว้ได้นะ" : "ใช้สิทธิ์ใบนี้แล้ว ขอบคุณเวลาที่เราได้ให้กัน"}</p><div className="pocket-dialog-actions"><Button variant="secondary" onClick={() => setSelected(null)}>ปิด</Button><Button disabled>{selected.state === "expired" ? "หมดอายุแล้ว" : "ใช้แล้ว"}</Button></div></>}
        </TicketDetail>}
      </Dialog>}
    </div>
  );
}
