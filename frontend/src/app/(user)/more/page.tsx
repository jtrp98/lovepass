"use client";
import { Button, Card, LinkButton, PageTitle } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
export default function MorePage() {
  const { user, logout } = useAuth(),
    router = useRouter();
  return (
    <div className="space-y-4">
      <PageTitle title="เพิ่มเติม" subtitle="เรื่องราวและบัญชีของเรา" />
      <Card variant="journal" className="grid gap-3 sm:grid-cols-2">
        {[
          { href: "/couple", label: "คู่ของฉัน" },
          { href: "/history", label: "ประวัติ" },
          { href: "/sent-gifts", label: "ของขวัญที่ส่ง" },
          { href: "/packs", label: "ซองคูปองของเรา" },
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
      <Button
        variant="ghost"
        onClick={() => {
          logout();
          router.push("/login");
        }}
      >
        ออกจากระบบ
      </Button>
    </div>
  );
}
