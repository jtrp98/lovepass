"use client";

import { useEffect, useRef, useState } from "react";
import { Button, ErrorText, Field, Textarea } from "./ui";

/** Both stages stay inside the native dialog's focus trap. */
export function TicketRequest({ name, busy, error, onConfirm, onClose }: {
  name: string;
  busy: boolean;
  error?: string | null;
  onConfirm: (message: string) => void;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const confirmation = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirming) confirmation.current?.focus();
  }, [confirming]);
  return (
    <div className="pocket-request">
      {confirming ? <>
        <h3 ref={confirmation} tabIndex={-1}>ส่งคำขอใช้ใบนี้นะ?</h3>
        <p>“{name}” จะกันคูปอง 1 ใบไว้ แล้วรอแฟนยืนยันก่อนใช้จริง</p>
        {message && <p className="pocket-message">{message}</p>}
        <ErrorText message={error} />
        <div className="pocket-dialog-actions">
          <Button variant="secondary" disabled={busy} onClick={() => {
            setConfirming(false);
            requestAnimationFrame(() => opener.current?.focus());
          }}>กลับไปแก้</Button>
          <Button disabled={busy} onClick={() => onConfirm(message)}>{busy ? "กำลังส่ง..." : "ยืนยันส่งคำขอ"}</Button>
        </div>
      </> : <>
        <Field label="ฝากข้อความถึงแฟน" hint="ไม่เขียนก็ได้นะ">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="วันนี้ขอกอดนานหน่อยนะ" />
        </Field>
        <div className="pocket-dialog-actions">
          <Button variant="secondary" onClick={onClose}>ปิด</Button>
          <button ref={opener} type="button" className="pocket-action" onClick={() => setConfirming(true)}>ขอใช้ใบนี้ <span aria-hidden="true">↗</span></button>
        </div>
      </>}
    </div>
  );
}
