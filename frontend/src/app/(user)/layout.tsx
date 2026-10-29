"use client";

import { Navbar } from "@/components/nav";
import { RequireAuth } from "@/lib/auth";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:p-3">
        ข้ามไปเนื้อหา
      </a>
      <Navbar />
      <main id="main-content" className="user-content mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </RequireAuth>
  );
}
