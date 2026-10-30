"use client";

import {
  Button,
  Dialog,
  Notice,
  Skeleton,
  ErrorState,
  LinkButton,
  EmptyState,
  ErrorText,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import type { Redemption } from "@/types";
import { CouponRequestCard } from "@/components/coupon-request-card";
import { TicketIllustration } from "@/components/ticket-illustration";

export default function RequestsPage() {
  const [direction, setDirection] = useState<"received" | "sent">("received");
  const [items, setItems] = useState<Redemption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [review, setReview] = useState<Redemption | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const lock = useRef(false);
  const sequence = useRef(0);

  async function load(dir: "received" | "sent") {
    const current = ++sequence.current;
    setItems(null);
    setError(null);
    try {
      const data = await api.redemptions.list(dir);
      if (current === sequence.current) setItems(data);
    } catch (err) {
      if (current === sequence.current)
        setError(err instanceof ApiError ? err.displayMessage : "โหลดคำขอไม่สำเร็จ");
    }
  }

  useEffect(() => {
    void load(direction);
  }, [direction]);

  async function act(id: number, action: "approve" | "reject" | "cancel") {
    if (lock.current) return;
    lock.current = true;
    setActionError(null);
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      if (action === "approve") await api.redemptions.approve(id);
      if (action === "reject") await api.redemptions.reject(id);
      if (action === "cancel") await api.redemptions.cancel(id);
      setNotice(
        action === "approve"
          ? "อนุมัติคำขอแล้ว ขอให้เป็นช่วงเวลาดี ๆ ของเรานะ"
          : action === "reject"
            ? "ปฏิเสธคำขอแล้ว คืนสิทธิ์ให้แฟน"
            : "ยกเลิกคำขอแล้ว ได้สิทธิ์คืน",
      );
      setReview(null);
      await load(direction);
    } catch (err) {
      const message = err instanceof ApiError ? err.displayMessage : "ดำเนินการไม่สำเร็จ";
      if (action === "approve") setActionError(message);
      else setError(message);
    } finally {
      lock.current = false;
      setBusyId(null);
    }
  }

  return (
    <div className="pocket-book requests-page space-y-6">
      <header className="pocket-intro">
        <div>
          <p className="pocket-mono"><span className="pocket-foil" aria-hidden="true" />A LITTLE NOTE BETWEEN US</p>
          <h1 tabIndex={-1}>คำขอใช้คูปอง</h1>
          <p>จดหมายใบเล็ก ๆ ก่อนใช้เวลาดี ๆ ด้วยกัน</p>
        </div>
        <div className="pocket-seal" aria-hidden="true"><small>A NOTE</small><span>for us</span><small>WITH LOVE</small></div>
      </header>

      <div className="status-tabs flex flex-wrap gap-2" role="group" aria-label="รายการคำขอ">
        {(["received", "sent"] as const).map((dir) => (
          <button
            key={dir}
            disabled={busyId !== null || review !== null}
            aria-pressed={direction === dir}
            onClick={() => setDirection(dir)}
            className="status-tab disabled:opacity-60"
          >
            {dir === "received" ? "คำขอที่ต้องพิจารณา" : "คำขอที่ฉันส่ง"}
          </button>
        ))}
      </div>

      {notice && <Notice>{notice}</Notice>}

      {error ? (
        <ErrorState message={error} retry={() => load(direction)} />
      ) : !items ? (
        <Skeleton />
      ) : items.length === 0 ? (
        <EmptyState
          action={
            <LinkButton href={direction === "sent" ? "/my-coupons" : "/dashboard"} variant="secondary">
              {direction === "sent" ? "ดูคูปองฉัน" : "กลับบ้านของเรา"}
            </LinkButton>
          }
          title={direction === "received" ? "ยังไม่มีคำขอที่ต้องพิจารณา" : "ยังไม่ได้ส่งคำขอใช้คูปอง"}
          hint={direction === "received" ? "เมื่อแฟนขอใช้ รายการจะขึ้นที่นี่" : "ไปที่คูปองของฉันแล้วกดขอใช้"}
        />
      ) : (
        <div className="pocket-collection">
          {items.map((item) => (
            <CouponRequestCard key={item.id} item={item} direction={direction}>
              {item.status === "PENDING" ? (
                <>
                  {direction === "received" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setActionError(null);
                          setReview(item);
                        }}
                        disabled={busyId !== null}
                      >
                        อนุมัติ <span aria-hidden="true">↗</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => act(item.id, "reject")}
                        disabled={busyId !== null}
                      >
                        ปฏิเสธ
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => act(item.id, "cancel")}
                      disabled={busyId !== null}
                    >
                      ยกเลิกคำขอ
                    </Button>
                  )}
                </>
              ) : null}
            </CouponRequestCard>
          ))}
        </div>
      )}
      {review && (
        <Dialog title="ทบทวนก่อนให้ใช้คูปอง" className="ticket-dialog" busy={busyId !== null} onClose={() => setReview(null)}>
          <div className="request-review pocket-detail" data-rarity={review.rarity}>
            <TicketIllustration category={review.category} />
            <p><strong>{review.requesterName}</strong> ขอใช้<br /><span>{review.couponName}</span></p>
            {review.message && <blockquote className="request-note"><p>{review.message}</p></blockquote>}
          </div>
          <p>เมื่อยืนยันจะใช้สิทธิ์ 1 ใบ การอนุมัติย้อนกลับไม่ได้</p>
          <ErrorText message={actionError} />
          <div className="pocket-dialog-actions">
            <Button variant="secondary" disabled={busyId !== null} onClick={() => setReview(null)}>
              ยกเลิก
            </Button>
            <Button disabled={busyId !== null} onClick={() => act(review.id, "approve")}>
              ยืนยันให้ใช้ 1 ใบ
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
