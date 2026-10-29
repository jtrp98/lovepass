"use client";

import {
  LinkButton,
  ErrorState,
  Skeleton,
  Card,
  EmptyState,
  PageTitle,
  RarityBadge,
  formatDate,
  formatDateTime,
} from "@/components/ui";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";

export default function SentGiftsPage() {
  const resource = useResource(api.gifts.sent);
  const gifts = resource.data;

  return (
    <div className="space-y-6">
      <PageTitle title="คูปองที่เคยมอบ 🎁" subtitle="ประวัติการมอบคูปองให้แฟน" />

      {resource.error ? (
        <ErrorState message={resource.error} retry={resource.retry} />
      ) : resource.loading || !gifts ? (
        <Skeleton />
      ) : gifts.length === 0 ? (
        <EmptyState
          action={<LinkButton href="/catalog">เลือกของขวัญให้แฟน</LinkButton>}
          title="ยังไม่เคยมอบคูปอง"
          hint="ไปเลือกคูปองสวย ๆ มอบให้แฟนกัน 😊"
        />
      ) : (
        <div className="space-y-4">
          {gifts.map((gift) => (
            <Card key={gift.id} className="space-y-2">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <p className="text-sm font-semibold text-muted">{formatDateTime(gift.createdAt)}</p>
                <p className="text-sm font-semibold text-love">
                  รวม {gift.coupons.reduce((sum, c) => sum + c.quantity, 0)} ใบ
                </p>
              </div>
              {gift.message ? (
                <p className="rounded-lg bg-love-soft px-3 py-1.5 text-sm">“{gift.message}”</p>
              ) : null}
              <ul className="space-y-1.5">
                {gift.coupons.map((coupon, index) => (
                  <li
                    key={index}
                    className="flex flex-wrap gap-2 items-center justify-between gap-2 rounded-lg border border-control px-3 py-2 text-sm"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-lg">{coupon.emoji ?? "🎟️"}</span>
                      {coupon.name}
                      <RarityBadge rarity={coupon.rarity} />
                    </span>
                    <span className="flex flex-wrap items-center gap-3 text-muted">
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
