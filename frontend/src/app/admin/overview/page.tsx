"use client";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageTitle,
  RarityBadge,
  Skeleton,
  StatusBadge,
  formatDateTime,
} from "@/components/ui";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";
import { useState } from "react";
export default function AdminOverviewPage() {
  const gifts = useResource(api.admin.gifts),
    requests = useResource(api.admin.redemptions);
  const [view, setView] = useState("gifts");
  return (
    <div className="space-y-6">
      <PageTitle title="กิจกรรมในระบบ" subtitle="ข้อมูลจากการโหลดล่าสุด สูงสุด 200 รายการต่อประเภท" />
      <div className="flex flex-wrap gap-2">
        <Button
          variant={view === "gifts" ? "primary" : "secondary"}
          aria-pressed={view === "gifts"}
          onClick={() => setView("gifts")}
        >
          ของขวัญ
        </Button>
        <Button
          variant={view === "requests" ? "primary" : "secondary"}
          aria-pressed={view === "requests"}
          onClick={() => setView("requests")}
        >
          คำขอใช้
        </Button>
      </div>
      <section hidden={view !== "gifts"} className="space-y-3">
        <h2>ของขวัญที่ส่ง</h2>
        {gifts.error ? (
          <ErrorState message={gifts.error} retry={gifts.retry} />
        ) : gifts.loading ? (
          <Skeleton />
        ) : !gifts.data?.length ? (
          <EmptyState title="ยังไม่มีการมอบคูปอง" />
        ) : (
          gifts.data.map((gift) => (
            <Card key={gift.id} className="space-y-2">
              <h3 className="font-semibold">ของขวัญ #{gift.id}</h3>
              <p className="text-sm text-muted">{formatDateTime(gift.createdAt)}</p>
              {gift.message && <p>{gift.message}</p>}
              <ul className="space-y-2">
                {gift.coupons.map((c, i) => (
                  <li key={i} className="flex flex-wrap gap-2">
                    {c.emoji} {c.name} <RarityBadge rarity={c.rarity} /> ×{c.quantity}
                  </li>
                ))}
              </ul>
            </Card>
          ))
        )}
      </section>
      <section hidden={view !== "requests"} className="space-y-3">
        <h2>คำขอใช้คูปอง</h2>
        {requests.error ? (
          <ErrorState message={requests.error} retry={requests.retry} />
        ) : requests.loading ? (
          <Skeleton />
        ) : !requests.data?.length ? (
          <EmptyState title="ยังไม่มีคำขอใช้คูปอง" />
        ) : (
          requests.data.map((r) => (
            <Card key={r.id} className="space-y-2">
              <h3 className="font-semibold">
                {r.emoji} {r.couponName}
              </h3>
              <StatusBadge status={r.status} />
              <p>
                ผู้ขอ: {r.requesterName} · ผู้พิจารณา: {r.approverName ?? "รอพิจารณา"}
              </p>
              <p className="text-sm text-muted">{formatDateTime(r.requestedAt)}</p>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
