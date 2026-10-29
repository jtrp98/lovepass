"use client";

import { Navbar } from "@/components/nav";
import { RequireAuth } from "@/lib/auth";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </RequireAuth>
  );
}
