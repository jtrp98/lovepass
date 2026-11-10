"use client";

import { useState } from "react";
import Link from "next/link";
import { LuHistory, LuSparkles, LuChevronDown } from "react-icons/lu";
import { Button, Card, Dialog } from "@/components/ui";
import { CHANGELOG, getCurrentRelease, type ReleaseEntry } from "@/config/changelog";
import { APP_VERSION } from "@/lib/version";

export function UpdatesDialog({ onClose }: { onClose: () => void }) {
  const [selectedVersion, setSelectedVersion] = useState<string>(APP_VERSION);
  const [showHistory, setShowHistory] = useState(false);

  const activeRelease: ReleaseEntry = getCurrentRelease(selectedVersion);
  const isLatest = activeRelease.version === APP_VERSION;

  return (
    <Dialog title={`บันทึกเวอร์ชัน ${activeRelease.version}`} onClose={onClose} className="max-w-2xl">
      <div className="space-y-4">
        {/* Version Header Card */}
        <Card variant="journal" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="pocket-mono rounded-md bg-love-soft px-2.5 py-1 text-sm font-bold text-love">
                v{activeRelease.version}
              </span>
              {isLatest && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-paper px-2 py-0.5 text-xs font-semibold text-success-ink">
                  <LuSparkles className="h-3 w-3" aria-hidden="true" /> เวอร์ชันปัจจุบัน
                </span>
              )}
            </div>
            <time className="text-xs text-muted">{activeRelease.date}</time>
          </div>

          <h3 className="font-display text-lg font-semibold text-ink">{activeRelease.title}</h3>

          {/* Sections */}
          <div className="space-y-3 pt-1">
            {activeRelease.sections.map((section, idx) => (
              <div key={idx} className="space-y-1.5">
                <p className="text-sm font-semibold text-love">{section.title}</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-ink leading-relaxed">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-muted">
                      <span className="text-ink">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        {/* Previous Versions Toggle */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-muted hover:bg-canvas hover:text-love focus-visible:outline-none"
            aria-expanded={showHistory}
          >
            <span className="inline-flex items-center gap-1.5">
              <LuHistory className="h-3.5 w-3.5 text-love" aria-hidden="true" />
              <span>ประวัติเวอร์ชันก่อนหน้า</span>
            </span>
            <LuChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${showHistory ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          {showHistory && (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line bg-surface p-2">
              {CHANGELOG.map((entry) => (
                <button
                  key={entry.version}
                  type="button"
                  onClick={() => setSelectedVersion(entry.version)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    selectedVersion === entry.version
                      ? "bg-love-soft font-semibold text-love"
                      : "text-muted hover:bg-canvas hover:text-ink"
                  }`}
                >
                  <span className="pocket-mono font-bold">v{entry.version}</span>
                  <span className="truncate max-w-xs">{entry.title}</span>
                  <span className="text-2xs text-muted">{entry.date}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line">
          <Link
            href="/updates"
            onClick={onClose}
            className="inline-flex items-center text-xs text-love underline underline-offset-4 hover:text-love-hover"
          >
            เปิดอ่านประวัติการเดินทางทั้งหมด
          </Link>
          <Button variant="secondary" onClick={onClose} className="text-sm">
            ปิด
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
