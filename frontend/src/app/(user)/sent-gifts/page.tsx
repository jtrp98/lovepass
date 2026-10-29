"use client";

import { Card, EmptyState, PageTitle, RarityBadge, formatDate, formatDateTime } from "@/components/ui";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { SentGift } from "@/types";

export default function SentGiftsPage() {
  const [gifts, setGifts] = useState<SentGift[] | null>(null);

  useEffect(() => {
    api.gifts
      .sent()
      .then(setGifts)
      .catch(() => setGifts([]));
  }, []);

  return (
    <div className="space-y-6">
      <PageTitle title="คูปองที่เคยมอบ 🎁" subtitle="ประวัติการมอบคูปองให้แฟน" />

      {!gifts ? (
        <p className="text-gray-400">กำลังโหลด...</p>
      ) : gifts.length === 0 ? (
        <EmptyState title="ยังไม่เคยมอบคูปอง" hint="ไปเลือกคูปองสวย ๆ มอบให้แฟนกัน 😊" />
      ) : (
        <div className="space-y-4">
          {gifts.map((gift) => (
            <Card key={gift.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-500">{formatDateTime(gift.createdAt)}</p>
                <p className="text-sm font-bold text-rose-600">
                  รวม {gift.coupons.reduce((sum, c) => sum + c.quantity, 0)} ใบ
                </p>
              </div>
              {gift.message ? <p className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm">“{gift.message}”</p> : null}
              <ul className="space-y-1.5">
                {gift.coupons.map((coupon, index) => (
                  <li key={index} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{coupon.emoji ?? "🎟️"}</span>
                      {coupon.name}
                      <RarityBadge rarity={coupon.rarity} />
                    </span>
                    <span className="flex items-center gap-3 text-gray-500">
                      <span>
                        มอบ {coupon.quantity} · เหลือ {coupon.remaining}
                      </span>
                      <span>หมดอายุ {formatDate(coupon.expiresAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
