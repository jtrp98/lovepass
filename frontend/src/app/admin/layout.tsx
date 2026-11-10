"use client";

import { LuArrowLeft } from "react-icons/lu";
import { AdminNav } from "@/components/nav";
import { RequireAdmin } from "@/lib/auth";
import { APP_VERSION } from "@/lib/version";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-xl font-semibold text-lavender-ink">จัดการระบบ</p>
            <span className="pocket-mono rounded bg-canvas px-1.5 py-0.5 text-xs text-muted">v{APP_VERSION}</span>
          </div>
          <a href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-love">
            <LuArrowLeft className="h-4 w-4" aria-hidden="true" /> กลับหน้าผู้ใช้
          </a>
        </div>
        <AdminNav />
        {children}
      </main>
    </RequireAdmin>
  );
}
