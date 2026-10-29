"use client";

import { Card, EmptyState, PageTitle, formatDateTime } from "@/components/ui";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { HistoryEntry } from "@/types";

const typeMeta: Record<string, { emoji: string; label: string; className: string }> = {
  GIFT: { emoji: "🎁", label: "มอบคูปอง", className: "bg-rose-50 text-rose-700" },
  USED: { emoji: "✅", label: "ใช้คูปอง", className: "bg-green-50 text-green-700" },
  EXPIRED: { emoji: "⌛", label: "หมดอายุ", className: "bg-gray-100 text-gray-500" },
  REDEEMED_OUT: { emoji: "💞", label: "คูปองที่มอบถูกใช้", className: "bg-blue-50 text-blue-700" },
  RECEIVED: { emoji: "💌", label: "ได้รับคูปอง", className: "bg-purple-50 text-purple-700" },
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    api.history
      .list()
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  return (
    <div className="space-y-6">
      <PageTitle title="ประวัติ 📜" subtitle="การมอบ การใช้ และคูปองที่หมดอายุทั้งหมด" />

      {!entries ? (
        <p className="text-gray-400">กำลังโหลด...</p>
      ) : entries.length === 0 ? (
        <EmptyState title="ยังไม่มีประวัติ" />
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => {
            const meta = typeMeta[entry.type] ?? typeMeta.RECEIVED;
            return (
              <Card key={index} className="flex items-center gap-3 py-3">
                <span className="text-xl">{meta.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entry.title}</p>
                  {entry.detail ? <p className="truncate text-xs text-gray-500">{entry.detail}</p> : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}>{meta.label}</span>
                  <span className="text-xs text-gray-400">{formatDateTime(entry.occurredAt)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
