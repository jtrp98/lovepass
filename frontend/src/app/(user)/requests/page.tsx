"use client";

import { Button, Card, EmptyState, ErrorText, PageTitle, RarityBadge, formatDateTime } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { Redemption } from "@/types";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles[status] ?? statusStyles.CANCELLED}`}>
      {status}
    </span>
  );
}

export default function RequestsPage() {
  const [direction, setDirection] = useState<"received" | "sent">("received");
  const [items, setItems] = useState<Redemption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load(dir: "received" | "sent") {
    setItems(null);
    setError(null);
    try {
      setItems(await api.redemptions.list(dir));
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "โหลดคำขอไม่สำเร็จ");
      setItems([]);
    }
  }

  useEffect(() => {
    void load(direction);
  }, [direction]);

  async function act(id: number, action: "approve" | "reject" | "cancel") {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      if (action === "approve") await api.redemptions.approve(id);
      if (action === "reject") await api.redemptions.reject(id);
      if (action === "cancel") await api.redemptions.cancel(id);
      setNotice(action === "approve" ? "อนุมัติคำขอเรียบร้อย ✅" : action === "reject" ? "ปฏิเสธคำขอแล้ว คืนสิทธิ์ให้แฟน" : "ยกเลิกคำขอแล้ว ได้สิทธิ์คืน");
      await load(direction);
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle title="คำขอใช้คูปอง 💌" subtitle="อนุมัติ/ปฏิเสธคำขอของแฟน หรือดูคำขอที่ฉันส่งไป" />

      <div className="flex gap-2">
        {(["received", "sent"] as const).map((dir) => (
          <button
            key={dir}
            onClick={() => setDirection(dir)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              direction === dir
                ? "border-rose-400 bg-rose-100 font-semibold text-rose-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {dir === "received" ? "คำขอที่ต้องพิจารณา" : "คำขอที่ฉันส่ง"}
          </button>
        ))}
      </div>

      {notice ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p> : null}
      <ErrorText message={error} />

      {!items ? (
        <p className="text-gray-400">กำลังโหลด...</p>
      ) : items.length === 0 ? (
        <EmptyState
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
                  <p className="font-bold">{item.couponName}</p>
                  <RarityBadge rarity={item.rarity} />
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-sm text-gray-500">
                  {direction === "received" ? `${item.requesterName} ขอใช้` : `ขอใช้จากแฟน`} ·{" "}
                  {formatDateTime(item.requestedAt)}
                  {item.resolvedAt ? ` · ตัดสิน ${formatDateTime(item.resolvedAt)}` : ""}
                </p>
                {item.message ? <p className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm">“{item.message}”</p> : null}
              </div>

              {item.status === "PENDING" ? (
                <div className="flex gap-2">
                  {direction === "received" ? (
                    <>
                      <Button size="sm" onClick={() => act(item.id, "approve")} disabled={busyId === item.id}>
                        อนุมัติ ✅
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => act(item.id, "reject")} disabled={busyId === item.id}>
                        ปฏิเสธ
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => act(item.id, "cancel")} disabled={busyId === item.id}>
                      ยกเลิกคำขอ
                    </Button>
                  )}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
