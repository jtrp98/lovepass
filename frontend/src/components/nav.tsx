"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import { LuHouse, LuGift, LuTicket, LuInbox, LuMenu, LuHeart } from "react-icons/lu";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui";

const links: { href: string; label: string; icon: IconType }[] = [
  { href: "/dashboard", label: "หน้าแรก", icon: LuHouse },
  { href: "/catalog", label: "เลือกของขวัญ", icon: LuGift },
  { href: "/my-coupons", label: "คูปองฉัน", icon: LuTicket },
  { href: "/requests", label: "คำขอ", icon: LuInbox },
  { href: "/more", label: "เพิ่มเติม", icon: LuMenu },
];

export function Navbar() {
  const { user, logout } = useAuth(),
    pathname = usePathname(),
    router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current!;
    const measure = () =>
      document.documentElement.style.setProperty(
        "--nav-height",
        window.matchMedia("(min-width: 768px)").matches ? "0px" : `${nav.getBoundingClientRect().height}px`,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    measure();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--nav-height");
    };
  }, []);

  return (
    <>
      <header className="app-header border-b border-love-soft bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center font-display text-lg font-semibold text-love sm:text-xl"
          >
            <span aria-hidden="true" className="brand-heart">
              <LuHeart className="h-4 w-4" />
            </span>{" "}
            LOVE PASS
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden max-w-32 truncate text-sm text-muted sm:inline">{user?.displayName}</span>
            <Button
              type="button"
              variant="secondary"
              className="text-sm"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </header>
      <nav
        ref={navRef}
        aria-label="เมนูหลัก"
        className="bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-control bg-surface md:static md:mx-auto md:w-full md:max-w-5xl md:rounded-b-2xl md:border-t-0"
      >
        {links.map((link) => {
          const active =
            link.href === "/catalog"
              ? ["/catalog", "/sets", "/gifts/new", "/packs/new"].includes(pathname)
              : link.href === "/more"
                ? ["/more", "/history", "/couple", "/couple/accept", "/gifts", "/sent-gifts"].includes(pathname)
                : pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`nav-link flex min-h-20 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-xs md:min-h-16 md:flex-row md:gap-2 md:text-base ${active ? "font-semibold text-love" : "text-muted hover:bg-canvas"}`}
            >
              <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function GiftViews() {
  const pathname = usePathname();
  return (
    <nav aria-label="วิธีเลือกของขวัญ" className="flex flex-wrap gap-2">
      {[
        { href: "/catalog", label: "เลือกเอง" },
        { href: "/sets", label: "เลือกเป็นชุด" },
        { href: "/packs/new", label: "จัดเป็นชุดของขวัญ" },
      ].map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? "page" : undefined}
          className={`inline-flex min-h-12 items-center rounded-full border border-control px-4 ${pathname === link.href ? "bg-love-soft font-semibold text-love" : "bg-surface text-muted"}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="จัดการระบบ"
      className="grid grid-cols-2 gap-2 rounded-2xl bg-lavender-soft p-2 md:grid-cols-6"
    >
      {[
        { href: "/admin/dashboard", label: "ภาพรวม" },
        { href: "/admin/coupons", label: "ต้นแบบคูปอง" },
        { href: "/admin/sets", label: "ชุดคูปอง" },
        { href: "/admin/users", label: "ผู้ใช้" },
        { href: "/admin/couples", label: "คู่รัก" },
        { href: "/admin/overview", label: "กิจกรรม" },
      ].map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? "page" : undefined}
          className={`flex min-h-12 items-center justify-center rounded-xl px-3 text-center text-sm text-lavender-ink ${pathname === link.href ? "bg-surface font-semibold" : "hover:bg-surface"}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
