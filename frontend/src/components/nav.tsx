"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import { LuHouse, LuGift, LuTicket, LuInbox, LuMenu, LuHeart } from "react-icons/lu";
import { useAuth } from "@/lib/auth";
import { APP_VERSION } from "@/lib/version";
import { UpdatesDialog } from "@/components/updates-dialog";

const links: { href: string; label: string; icon: IconType }[] = [
  { href: "/dashboard", label: "หน้าแรก", icon: LuHouse },
  { href: "/catalog", label: "เลือกของขวัญ", icon: LuGift },
  { href: "/my-coupons", label: "คูปองฉัน", icon: LuTicket },
  { href: "/requests", label: "คำขอ", icon: LuInbox },
  { href: "/more", label: "เพิ่มเติม", icon: LuMenu },
];

export function Navbar() {
  const { user } = useAuth(),
    pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [showUpdates, setShowUpdates] = useState(false);
  const [hasNewVersion, setHasNewVersion] = useState(false);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem("lovepass_seen_version");
      if (seen !== APP_VERSION) {
        setHasNewVersion(true);
      }
    } catch {
      // Gracefully handle storage disabled/blocked
    }
  }, []);

  const handleVersionClick = () => {
    try {
      window.localStorage.setItem("lovepass_seen_version", APP_VERSION);
    } catch {}
    setHasNewVersion(false);
    setShowUpdates(true);
  };

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
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center font-display text-lg font-semibold text-love sm:text-xl"
            >
              <span aria-hidden="true" className="brand-heart">
                <LuHeart className="h-4 w-4" />
              </span>{" "}
              LOVE PASS
            </Link>
            <button
              type="button"
              onClick={handleVersionClick}
              className="group inline-flex min-h-11 items-center px-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-full"
              title="ดูบันทึกการอัปเดต"
              aria-label={`เวอร์ชัน ${APP_VERSION}${hasNewVersion ? " มีการอัปเดตใหม่" : ""}`}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas/80 px-2.5 py-1 text-muted transition-colors group-hover:border-love-soft group-hover:bg-love-soft/40 group-hover:text-love">
                <span className="pocket-mono font-medium">v{APP_VERSION}</span>
                {hasNewVersion && (
                  <span className="inline-flex items-center rounded-full bg-love px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider text-on-action shadow-xs">
                    NEW
                  </span>
                )}
              </span>
            </button>
          </div>
          <div className="flex min-w-0 items-center">
            <span className="max-w-40 truncate text-sm text-muted">{user?.displayName}</span>
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
      {showUpdates && <UpdatesDialog onClose={() => setShowUpdates(false)} />}
    </>
  );
}

export { GiftExperienceHeader } from "@/components/gift-experience-header";

export function GiftViews() {
  const pathname = usePathname();
  const modes = [
    { href: "/catalog", label: "เลือกคูปอง" },
    { href: "/sets", label: "ชุดสำเร็จ" },
    { href: "/packs/new", label: "จัดชุดเอง" },
  ];

  return (
    <nav aria-label="วิธีเลือกของขวัญ" className="gift-mode-nav">
      {modes.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className="gift-mode-tab"
          >
            <span>{link.label}</span>
          </Link>
        );
      })}
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
