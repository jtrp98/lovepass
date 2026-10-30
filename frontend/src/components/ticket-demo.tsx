"use client";

import { useState } from "react";
import { LoveTicket, type LoveTicketData } from "./love-ticket";
import { TicketRequest } from "./ticket-request";
import { Button, LinkButton } from "./ui";

const sample: LoveTicketData = {
  id: "FOR-YOU", name: "กอดเติมพลัง", note: "เหนื่อยเมื่อไหร่ มารับกอดอุ่น ๆ ได้หนึ่งครั้ง",
  terms: "เลือกเวลาที่เราทั้งคู่สะดวก", rarity: "COMMON", category: "AFFECTION", state: "available",
  quantity: 1, from: "คนที่รักเธอ", to: "เธอ",
};
const steps = ["แตะตั๋วให้กางออก", "ฉีกหางตั๋วเพื่อขอใช้", "แฟนยืนยัน ตั๋วถูกประทับตรา"];

/**
 * One ticket's whole life, playable by visitors: unfold, tear, approve, stamp.
 * Everything stays in this component; nothing is sent to the API.
 */
export function TicketDemo() {
  const [ticket, setTicket] = useState(sample);
  const [open, setOpen] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const step = ticket.state === "available" ? (open ? 1 : 0) : ticket.state === "pending" ? 2 : 3;
  // Mirrors a real round trip so the tear has time to read as "sending".
  const request = () => new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 350));
  function requested() {
    setTicket((current) => ({ ...current, state: "pending", quantity: 0, reserved: 1 }));
    setAnnouncement("ส่งคำขอตัวอย่างแล้ว ตั๋วรอแฟนยืนยัน");
  }
  function approve() {
    setTicket((current) => ({ ...current, state: "used", reserved: 0, redeemedAt: new Date().toISOString() }));
    setStamped(true);
    setAnnouncement("แฟนยืนยันแล้ว ตั๋วถูกประทับตราเป็นความทรงจำ");
  }
  function restart() {
    setTicket(sample);
    setStamped(false);
    setOpen(false);
    setAnnouncement("เริ่มตั๋วตัวอย่างใหม่แล้ว");
  }
  return (
    <section className="ticket-demo" aria-labelledby="ticket-demo-title">
      <p className="pocket-mono ticket-demo-label">TRY IT · ลองเล่นได้เลย ไม่มีการส่งจริง</p>
      <h2 id="ticket-demo-title" className="sr-only">ลองใช้ตั๋วตัวอย่าง</h2>
      <ol className="demo-steps">
        {steps.map((label, index) => (
          <li key={label} aria-current={index === step ? "step" : undefined} data-done={index < step || undefined}>
            <span aria-hidden="true">{index < step ? "✓" : index + 1}</span>{label}
          </li>
        ))}
      </ol>
      <LoveTicket ticket={ticket} open={open} animateStamp={stamped} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}>
        {ticket.state === "available" ? <TicketRequest name={ticket.name} busy={false} onTear={request} onDone={requested} />
          : ticket.state === "pending" ? <>
            <p className="pocket-terms">ในแอปจริง แฟนจะได้รับอีเมลแจ้งคำขอนี้ ลองกดยืนยันแทนแฟนดูนะ</p>
            <Button onClick={approve}>ยืนยันแทนแฟน</Button>
          </> : <>
            <p className="pocket-terms">ตั๋วใบนี้กลายเป็นความทรงจำในสมุดของเราแล้ว เริ่มสมุดของคุณเองได้เลย</p>
            <div className="demo-actions">
              <Button variant="secondary" onClick={restart}>ลองอีกครั้ง</Button>
              <LinkButton href="/register">เริ่มสมุดตั๋วของเรา</LinkButton>
            </div>
          </>}
      </LoveTicket>
      <p className="sr-only" role="status">{announcement}</p>
    </section>
  );
}
