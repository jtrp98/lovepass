"use client";

import { AdminNav } from "@/components/nav";
import { RequireAdmin } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xl font-semibold text-lavender-ink">จัดการระบบ</p>
          <a href="/dashboard" className="text-sm text-muted hover:text-love">
            ← กลับหน้าผู้ใช้
          </a>
        </div>
        <AdminNav />
        {children}
      </main>
    </RequireAdmin>
  );
}
