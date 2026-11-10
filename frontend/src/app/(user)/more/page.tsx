"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, LinkButton, PageTitle } from "@/components/ui";
import { UpdatesDialog } from "@/components/updates-dialog";
import { useAuth } from "@/lib/auth";
import { APP_VERSION } from "@/lib/version";

export default function MorePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUpdates, setShowUpdates] = useState(false);

  return (
    <div className="space-y-4">
      <PageTitle title="เพิ่มเติม" subtitle="เรื่องราวและบัญชีของเรา" />
      <Card variant="journal" className="grid gap-3 sm:grid-cols-2">
        {[
          { href: "/couple", label: "คู่ของฉัน" },
          { href: "/history", label: "ประวัติ" },
          { href: "/gifts", label: "ของขวัญของสองเรา" },
        ].map((link) => (
          <LinkButton key={link.href} href={link.href} variant="secondary">
            {link.label}
          </LinkButton>
        ))}
        {user?.isAdmin && (
          <LinkButton href="/admin/dashboard" variant="secondary">
            จัดการระบบ
          </LinkButton>
        )}
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          ออกจากระบบ
        </Button>
        <button
          type="button"
          onClick={() => setShowUpdates(true)}
          className="pocket-mono text-xs text-muted hover:text-love focus-visible:outline-none"
          title="ดูบันทึกการอัปเดต"
        >
          v{APP_VERSION}
        </button>
      </div>
      {showUpdates && <UpdatesDialog onClose={() => setShowUpdates(false)} />}
    </div>
  );
}
