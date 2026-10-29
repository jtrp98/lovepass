"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const userLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/catalog", label: "คลังคูปอง" },
  { href: "/sets", label: "ชุดคูปอง" },
  { href: "/my-coupons", label: "คูปองของฉัน" },
  { href: "/gifts/new", label: "มอบคูปอง" },
  { href: "/requests", label: "คำขอใช้" },
  { href: "/history", label: "ประวัติ" },
  { href: "/couple", label: "คู่ของฉัน" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-rose-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto px-4 py-2.5">
        <Link href="/dashboard" className="mr-2 shrink-0 text-lg font-bold text-rose-600">
          💝 LOVE PASS
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {userLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
                  active ? "bg-rose-100 font-semibold text-rose-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {user?.isAdmin ? (
            <Link
              href="/admin/dashboard"
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                pathname.startsWith("/admin") ? "bg-purple-100 font-semibold text-purple-700" : "text-purple-600 hover:bg-purple-50"
              }`}
            >
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="flex shrink-0 items-center gap-2 pl-2">
          <span className="hidden text-sm text-gray-500 sm:block">{user?.displayName}</span>
          <button
            className="rounded-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </header>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const links = [
    { href: "/admin/dashboard", label: "ภาพรวม" },
    { href: "/admin/coupons", label: "Coupon Templates" },
    { href: "/admin/sets", label: "Coupon Sets" },
    { href: "/admin/users", label: "ผู้ใช้" },
    { href: "/admin/overview", label: "รายการทั้งหมด" },
  ];

  return (
    <nav className="flex items-center gap-1 overflow-x-auto rounded-xl border border-purple-200 bg-purple-50 p-1.5">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${
              active ? "bg-white font-semibold text-purple-700 shadow-sm" : "text-purple-600 hover:bg-purple-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
