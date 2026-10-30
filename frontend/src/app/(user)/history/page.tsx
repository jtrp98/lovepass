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
import { RubberStamp } from "@/components/rubber-stamp";
import { StationeryIcon, type StationeryIconName } from "@/components/stationery";

const typeMeta: Record<string, { icon: StationeryIconName; label: string; className: string }> = {
  GIFT: { icon: "gift", label: "มอบคูปอง", className: "bg-love-soft text-love" },
  USED: { icon: "check", label: "ใช้คูปอง", className: "bg-mint-soft text-mint-ink" },
  EXPIRED: { icon: "hourglass", label: "หมดอายุ", className: "bg-canvas text-muted" },
  REDEEMED_OUT: { icon: "hearts", label: "คูปองที่มอบถูกใช้", className: "bg-sky-soft text-sky-ink" },
  RECEIVED: { icon: "letter", label: "ได้รับคูปอง", className: "bg-lavender-soft text-lavender-ink" },
};

export default function HistoryPage() {
  const resource = useResource(api.history.list);
  const entries = resource.data;

  return (
    <div className="space-y-6">
      <PageTitle title="สมุดความทรงจำ" subtitle="การมอบ การใช้ และคูปองที่หมดอายุทั้งหมด" />

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
        <div className="scrapbook-list">
          {entries.map((entry, index) => {
            const meta = typeMeta[entry.type] ?? typeMeta.RECEIVED;
            return (
              <Card key={index} className="scrapbook-entry flex flex-wrap items-center gap-3">
                <StationeryIcon name={meta.icon} className={`scrapbook-icon ${meta.className}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{entry.title}</p>
                  {entry.detail ? <p className="text-sm text-muted">{entry.detail}</p> : null}
                </div>
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.className}`}>
                    {meta.label}
                  </span>
                  <time dateTime={entry.occurredAt} className="text-sm text-muted">{formatDateTime(entry.occurredAt)}</time>
                </div>
                {["USED", "REDEEMED_OUT"].includes(entry.type) && <RubberStamp date={entry.occurredAt} />}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
