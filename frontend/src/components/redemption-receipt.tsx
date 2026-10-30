import { useId } from "react";
import type { LoveTicketData } from "./love-ticket";
import { TicketIllustration } from "./ticket-illustration";
import { formatDateTime } from "./ui";

/** A keepsake slip for one confirmed coupon (the ticket itself carries the stamp); no invented amounts or timestamps. */
export function RedemptionReceipt({ ticket }: { ticket: LoveTicketData }) {
  const heading = useId();
  return (
    <div className="memory-receipt-wrap">
      <section className="memory-receipt pocket-detail" data-rarity={ticket.rarity} aria-labelledby={heading}>
        <p className="pocket-mono">LOVE PASS / FOR TWO</p>
        <TicketIllustration category={ticket.category} />
        <h3 id={heading}>ใบรับความทรงจำ</h3>
        <p className="memory-receipt-status"><span aria-hidden="true">✓</span> แฟนยืนยันแล้ว</p>
        <div className="memory-receipt-item">
          <p className="pocket-mono">ONE LITTLE PROMISE, KEPT.</p>
          <p className="memory-receipt-name">{ticket.name}</p>
          <p className="pocket-note">{ticket.note}</p>
        </div>
        <dl className="memory-receipt-facts">
          <div><dt>จาก</dt><dd>{ticket.from ?? "คนที่รักเธอ"}</dd></div>
          {ticket.to && <div><dt>ถึง</dt><dd>{ticket.to}</dd></div>}
          <div><dt>เลขที่ตั๋ว</dt><dd className="pocket-mono">{ticket.id}</dd></div>
          <div><dt>สถานะ</dt><dd>ใช้สิทธิ์แล้ว ♡</dd></div>
          {ticket.redeemedAt && <div><dt>ใช้เมื่อ</dt><dd><time dateTime={ticket.redeemedAt}>{formatDateTime(ticket.redeemedAt)}</time></dd></div>}
        </dl>
        <p className="memory-receipt-thanks">ขอบคุณเวลาที่เราได้ให้กัน<br />เก็บใบนี้ไว้ยิ้มด้วยกันอีกนะ</p>
        <div className="memory-receipt-barcode" aria-hidden="true" />
        <p className="pocket-mono">A LITTLE MOMENT TO KEEP.</p>
      </section>
    </div>
  );
}
