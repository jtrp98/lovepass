"use client";

import { Button, Card, EmptyState, PageTitle, RarityBadge } from "@/components/ui";
import { api } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CouponSet } from "@/types";

export default function SetsPage() {
  const [sets, setSets] = useState<CouponSet[] | null>(null);

  useEffect(() => {
    api.catalog
      .sets()
      .then(setSets)
      .catch(() => setSets([]));
  }, []);

  return (
    <div className="space-y-6">
      <PageTitle title="ชุดคูปองสำเร็จรูป" subtitle="ชุดที่ Admin จัดไว้ เลือกมอบทั้งชุดได้ในคลิกเดียว" />

      {!sets ? (
        <p className="text-gray-400">กำลังโหลด...</p>
      ) : sets.length === 0 ? (
        <EmptyState title="ยังไม่มีชุดคูปอง" hint="Admin ยังไม่ได้สร้าง Coupon Set" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sets.map((set) => (
            <Card key={set.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold">{set.name}</p>
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                  รวม {set.totalCoupons} ใบ
                </span>
              </div>
              <p className="text-sm text-gray-600">{set.description}</p>

              <ul className="space-y-1.5">
                {set.items.map((item) => (
                  <li key={item.couponTemplateId} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-lg">{item.emoji ?? "🎟️"}</span>
                      {item.name}
                    </span>
                    <span className="flex items-center gap-2">
                      <RarityBadge rarity={item.rarity} />
                      <span className="text-sm font-semibold">×{item.quantity}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={`/gifts/new?set=${set.id}`} className="mt-auto">
                <Button className="w-full">มอบชุดนี้ให้แฟน 💝</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
