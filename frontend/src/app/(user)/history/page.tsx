"use client";

import {
  LinkButton,
  ErrorState,
  Skeleton,
  Card,
  EmptyState,
  PageTitle,
  formatDateTime,
} from "@/components/ui";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";

const typeMeta: Record<string, { emoji: string; label: string; className: string }> = {
  GIFT: { emoji: "🎁", label: "มอบคูปอง", className: "bg-love-soft text-love" },
  USED: { emoji: "✅", label: "ใช้คูปอง", className: "bg-mint-soft text-mint-ink" },
  EXPIRED: { emoji: "⌛", label: "หมดอายุ", className: "bg-canvas text-muted" },
  REDEEMED_OUT: { emoji: "💞", label: "คูปองที่มอบถูกใช้", className: "bg-sky-soft text-sky-ink" },
  RECEIVED: { emoji: "💌", label: "ได้รับคูปอง", className: "bg-lavender-soft text-lavender-ink" },
};

export default function HistoryPage() {
  const resource = useResource(api.history.list);
  const entries = resource.data;

  return (
    <div className="space-y-6">
      <PageTitle title="ประวัติ 📜" subtitle="การมอบ การใช้ และคูปองที่หมดอายุทั้งหมด" />

      {resource.error ? (
        <ErrorState message={resource.error} retry={resource.retry} />
      ) : resource.loading || !entries ? (
        <Skeleton />
      ) : entries.length === 0 ? (
        <EmptyState
          action={<LinkButton href="/catalog">เลือกของขวัญให้แฟน</LinkButton>}
          title="ยังไม่มีประวัติ"
        />
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const meta = typeMeta[entry.type] ?? typeMeta.RECEIVED;
            return (
              <Card key={index} className="flex flex-wrap items-center gap-3 py-3">
                <span className="text-xl">{meta.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{entry.title}</p>
                  {entry.detail ? <p className="text-sm text-muted">{entry.detail}</p> : null}
                </div>
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>
                    {meta.label}
                  </span>
                  <span className="text-sm text-muted">{formatDateTime(entry.occurredAt)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
