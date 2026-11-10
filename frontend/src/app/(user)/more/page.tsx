"use client";
import { useRouter } from "next/navigation";
import { Button, Card, LinkButton, PageTitle } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function MorePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

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
      <div className="pt-2">
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
    </div>
  );
}
