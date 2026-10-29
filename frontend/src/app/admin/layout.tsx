"use client";

import { AdminNav } from "@/components/nav";
import { RequireAdmin } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-purple-700">Admin Console</h1>
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-rose-600">
            ← กลับหน้าผู้ใช้
          </a>
        </div>
        <AdminNav />
        {children}
      </main>
    </RequireAdmin>
  );
}
