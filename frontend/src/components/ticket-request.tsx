"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { ErrorText, Field, Textarea } from "./ui";

/** How far along the perforation a drag must reach before letting go tears the stub. */
const TEAR_AT = 0.7;
type Phase = "idle" | "dragging" | "sending" | "torn";

/**
 * Tear the stub off along the perforation to ask for this coupon. Dragging the tab is
 * the confirmation; keyboard and assistive-tech activation of the tab tears it in one
 * step. The stub only falls away after `onTear` resolves true — a failure lets it
 * spring back with the note kept.
 */
export function TicketRequest({ name, busy, error, onTear, onDone }: {
  name: string;
  busy: boolean;
  error?: string | null;
  onTear: (message: string) => Promise<boolean>;
  onDone: () => void;
}) {
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [nudged, setNudged] = useState(false);
  const guide = useId();
  const track = useRef<HTMLDivElement>(null);
  const tear = useRef(0);
  const drag = useRef<{ x: number; width: number; moved: boolean } | null>(null);

  const ticket = () => track.current?.closest<HTMLElement>(".pocket-ticket") ?? null;
  // Written straight to the ticket so the stub follows the pointer without re-rendering.
  function setTear(value: number) {
    tear.current = value;
    ticket()?.style.setProperty("--tear", String(value));
  }
  useEffect(() => {
    const element = ticket();
    if (element) element.dataset.tear = phase;
  }, [phase]);
  useEffect(() => {
    const element = ticket();
    return () => {
      element?.style.removeProperty("--tear");
      if (element) delete element.dataset.tear;
    };
  }, []);

  async function commit() {
    if (phase === "sending" || phase === "torn" || busy) return;
    setPhase("sending");
    setTear(1);
    if (!(await onTear(message))) {
      setPhase("idle");
      setTear(0);
      return;
    }
    setPhase("torn");
    window.setTimeout(onDone, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 480);
  }
  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (phase !== "idle" || busy || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const width = (track.current?.getBoundingClientRect().width ?? 300) - event.currentTarget.offsetWidth;
    drag.current = { x: event.clientX, width: Math.max(width, 80), moved: false };
    setPhase("dragging");
  }
  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current) return;
    const progress = Math.min(1, Math.max(0, (event.clientX - current.x) / current.width));
    if (progress > 0.03) current.moved = true;
    setTear(progress);
  }
  function onPointerUp() {
    const current = drag.current;
    drag.current = null;
    if (!current) return;
    if (tear.current >= TEAR_AT) return void commit();
    setPhase("idle");
    setTear(0);
    if (!current.moved) {
      // A plain tap shows how to tear instead of sending anything.
      setNudged(true);
      setTear(0.12);
      window.setTimeout(() => setTear(0), 240);
    }
  }

  const sending = phase === "sending" || busy;
  return (
    <div className="tear-request" data-phase={phase}>
      <div className="tear-track" ref={track}>
        <button
          type="button"
          className="tear-tab"
          aria-label={`ฉีกหางตั๋วเพื่อส่งคำขอใช้ ${name}`}
          aria-describedby={guide}
          disabled={sending || phase === "torn"}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={(event) => { if (event.detail === 0) void commit(); }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="6" cy="7" r="3" /><circle cx="6" cy="17" r="3" /><path d="M8.6 8.6 20 18M8.6 15.4 20 6" />
          </svg>
          <span>ฉีก</span>
        </button>
        <span className="tear-guide" id={guide} data-nudged={nudged || undefined}>
          {sending ? "กำลังส่งคำขอ…" : "ลากตามรอยปรุไปทางขวา ฉีกหางตั๋วเพื่อส่งคำขอ"}
        </span>
      </div>
      <Field label="เขียนโน้ตบนหางตั๋ว" hint="ไม่เขียนก็ได้นะ แฟนจะเห็นโน้ตนี้ตอนยืนยัน">
        <Textarea className="tear-note" value={message} disabled={sending} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="วันนี้ขอกอดนานหน่อยนะ" />
      </Field>
      <ErrorText message={phase === "idle" ? error : null} />
      <p className="sr-only" role="status">{sending ? "กำลังส่งคำขอ" : ""}</p>
    </div>
  );
}
