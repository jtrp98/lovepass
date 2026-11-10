"use client";

import { LinkButton, ErrorState, Skeleton, Card, EmptyState, RarityBadge } from "@/components/ui";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";
import { GiftExperienceHeader, GiftViews } from "@/components/nav";
import { StationeryIcon } from "@/components/stationery";
import { useEffect, useState } from "react";

const SETS_EXPANDED_KEY = "lovepass.setsExpanded";
const INITIAL_VISIBLE_COUNT = 4;

export default function SetsPage() {
  const resource = useResource(api.catalog.sets);
  const sets = resource.data;
  const [expandedSets, setExpandedSets] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SETS_EXPANDED_KEY);
      if (raw) setExpandedSets(JSON.parse(raw));
    } catch {}
  }, []);

  function toggleSetExpand(setId: number) {
    setExpandedSets((prev) => {
      const next = { ...prev, [setId]: !prev[setId] };
      try {
        sessionStorage.setItem(SETS_EXPANDED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  return (
    <div className="pocket-book space-y-6 pb-24">
      <GiftExperienceHeader />
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
          {sets.map((set) => {
            const isExpanded = !!expandedSets[set.id];
            const hasMore = set.items.length > INITIAL_VISIBLE_COUNT;
            const visibleItems = isExpanded
              ? set.items
              : set.items.slice(0, INITIAL_VISIBLE_COUNT);

            return (
              <Card key={set.id} variant="booklet" className="flex flex-col gap-3.5 p-5">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <p className="text-lg font-semibold text-ink">{set.name}</p>
                  <span className="rounded-full bg-love-soft px-2.5 py-0.5 text-xs font-semibold text-love">
                    รวม {set.totalCoupons} ใบ
                  </span>
                </div>
                <p className="text-sm text-muted leading-relaxed">{set.description}</p>

                <ul className="space-y-1.5 pt-1" aria-label={`รายการคูปองในชุด ${set.name}`}>
                  {visibleItems.map((item) => (
                    <li
                      key={item.couponTemplateId}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-line px-2 py-1.5 text-sm"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <StationeryIcon name="ticket" className="h-5 w-5 text-love shrink-0" />
                        <span className="font-medium text-ink">{item.name}</span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <RarityBadge rarity={item.rarity} />
                        <span className="text-sm font-semibold text-ink">×{item.quantity}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                {hasMore && (
                  <button
                    type="button"
                    onClick={() => toggleSetExpand(set.id)}
                    aria-expanded={isExpanded}
                    className="inline-flex min-h-11 items-center justify-center py-2 text-center text-sm font-semibold text-love hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg transition-colors"
                  >
                    {isExpanded
                      ? "ย่อรายการคูปอง ↑"
                      : `ดูคูปองทั้งหมด ${set.totalCoupons} ใบ ↓`}
                  </button>
                )}

                <LinkButton href={`/gifts/new?set=${set.id}`} className="mt-auto w-full">
                  เลือกชุดนี้
                </LinkButton>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
