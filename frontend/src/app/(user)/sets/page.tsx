"use client";

import { LinkButton, ErrorState, Skeleton, Card, EmptyState, PageTitle, RarityBadge } from "@/components/ui";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";
import { GiftViews } from "@/components/nav";

export default function SetsPage() {
  const resource = useResource(api.catalog.sets);
  const sets = resource.data;

  return (
    <div className="space-y-6">
      <PageTitle title="ชุดคูปองสำเร็จรูป" subtitle="เลือกชุด แล้วตรวจของขวัญก่อนส่งให้แฟน" />

      <GiftViews />
      {resource.error ? (
        <ErrorState message={resource.error} retry={resource.retry} />
      ) : resource.loading || !sets ? (
        <Skeleton />
      ) : sets.length === 0 ? (
        <EmptyState
          title="ยังไม่มีชุดคูปอง"
          hint="เลือกคูปองเองได้จากอีกมุมมอง"
          action={<LinkButton href="/catalog">เลือกเอง</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sets.map((set) => (
            <Card key={set.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <p className="text-lg font-semibold">{set.name}</p>
                <span className="rounded-full bg-love-soft px-2.5 py-0.5 text-xs font-semibold text-love">
                  รวม {set.totalCoupons} ใบ
                </span>
              </div>
              <p className="text-sm text-muted">{set.description}</p>

              <ul className="space-y-1.5">
                {set.items.map((item) => (
                  <li
                    key={item.couponTemplateId}
                    className="flex flex-wrap gap-2 items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-2"
                  >
                    <span className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-lg">{item.emoji ?? "🎟️"}</span>
                      {item.name}
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <RarityBadge rarity={item.rarity} />
                      <span className="text-sm font-semibold">×{item.quantity}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <LinkButton href={`/gifts/new?set=${set.id}`} className="mt-auto w-full">
                เลือกชุดนี้
              </LinkButton>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
