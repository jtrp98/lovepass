"use client";

import {
  Button,
  Card,
  Dialog,
  StatusBadge,
  Notice,
  Skeleton,
  ErrorState,
  LinkButton,
  EmptyState,
  ErrorText,
  PageTitle,
  RarityBadge,
  formatDateTime,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import type { Redemption } from "@/types";

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
          ? "อนุมัติคำขอเรียบร้อย ✅"
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
    <div className="space-y-6">
      <PageTitle title="คำขอใช้คูปอง 💌" subtitle="อนุมัติ/ปฏิเสธคำขอของแฟน หรือดูคำขอที่ฉันส่งไป" />

      <div className="flex flex-wrap gap-2">
        {(["received", "sent"] as const).map((dir) => (
          <button
            key={dir}
            disabled={busyId !== null || review !== null}
            aria-pressed={direction === dir}
            onClick={() => setDirection(dir)}
            className={`min-h-12 rounded-full border px-4 py-2 text-sm transition ${
              direction === dir
                ? "border-control bg-love-soft font-semibold text-love"
                : "border-control text-muted hover:bg-canvas"
            }`}
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
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl">{item.emoji ?? "🎟️"}</span>
                  <p className="font-semibold">{item.couponName}</p>
                  <RarityBadge rarity={item.rarity} />
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-sm text-muted">
                  {direction === "received" ? `${item.requesterName} ขอใช้` : `ขอใช้จากแฟน`} ·{" "}
                  {formatDateTime(item.requestedAt)}
                  {item.resolvedAt ? ` · ตัดสิน ${formatDateTime(item.resolvedAt)}` : ""}
                </p>
                {item.message ? (
                  <p className="rounded-lg bg-love-soft px-3 py-1.5 text-sm">“{item.message}”</p>
                ) : null}
              </div>

              {item.status === "PENDING" ? (
                <div className="flex gap-2">
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
                        อนุมัติ ✅
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
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
      {review && (
        <Dialog title="ทบทวนก่อนให้ใช้คูปอง" busy={busyId !== null} onClose={() => setReview(null)}>
          <p>
            <strong>{review.requesterName}</strong> ขอใช้ “{review.couponName}”
          </p>
          <p>เมื่อยืนยันจะใช้สิทธิ์ 1 ใบ การอนุมัติย้อนกลับไม่ได้</p>
          <ErrorText message={actionError} />
          <div className="flex flex-wrap gap-3">
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
