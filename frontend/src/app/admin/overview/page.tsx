"use client";

import { Card, EmptyState, PageTitle, RarityBadge, formatDateTime } from "@/components/ui";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { Redemption, SentGift } from "@/types";

export default function AdminOverviewPage() {
  const [gifts, setGifts] = useState<SentGift[] | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[] | null>(null);

  useEffect(() => {
    api.admin.gifts().then(setGifts).catch(() => setGifts([]));
    api.admin.redemptions().then(setRedemptions).catch(() => setRedemptions([]));
  }, []);

  return (
    <div className="space-y-8">
      <PageTitle title="System Overview" subtitle="รายการมอบคูปองและ Redemption ทั้งระบบ (200 รายการล่าสุด)" />

      <section className="space-y-3">
        <h2 className="font-bold text-gray-700">การมอบคูปอง</h2>
        {!gifts ? (
          <p className="text-gray-400">กำลังโหลด...</p>
        ) : gifts.length === 0 ? (
          <EmptyState title="ยังไม่มีการมอบคูปอง" />
        ) : (
          gifts.map((gift) => (
            <Card key={gift.id} className="space-y-1 py-3">
              <p className="text-sm font-semibold">{gift.message ?? "(ไม่มีข้อความ)"}</p>
              <p className="text-xs text-gray-400">{formatDateTime(gift.createdAt)}</p>
              <p className="text-sm text-gray-600">
                {gift.coupons.map((c, i) => (
                  <span key={i} className="mr-2">
                    {c.emoji ?? "🎟️"} {c.name} <RarityBadge rarity={c.rarity} /> ×{c.quantity}
                  </span>
                ))}
              </p>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-gray-700">Redemptions</h2>
        {!redemptions ? (
          <p className="text-gray-400">กำลังโหลด...</p>
        ) : redemptions.length === 0 ? (
          <EmptyState title="ยังไม่มีคำขอใช้คูปอง" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <th className="px-4 py-3">คูปอง</th>
                  <th className="px-4 py-3">ผู้ขอ</th>
                  <th className="px-4 py-3">ผู้พิจารณา</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">เมื่อ</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">
                      {r.emoji ?? "🎟️"} {r.couponName}
                    </td>
                    <td className="px-4 py-3">{r.requesterName}</td>
                    <td className="px-4 py-3 text-gray-500">{r.approverName ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDateTime(r.requestedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
