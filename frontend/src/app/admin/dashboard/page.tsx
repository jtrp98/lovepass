"use client";

import { Button, ErrorState, Skeleton, PageTitle, StatCard } from "@/components/ui";
import Link from "next/link";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";

export default function AdminDashboardPage() {
  const resource = useResource(api.admin.stats);
  const stats = resource.data;
  if (resource.error) return <ErrorState message={resource.error} retry={resource.retry} />;
  if (resource.loading || !stats) return <Skeleton />;

  return (
    <div className="space-y-6">
      <PageTitle
        title="ภาพรวมระบบ"
        subtitle="ข้อมูลจากการโหลดล่าสุด กดรีเฟรชเพื่อดูข้อมูลใหม่"
        action={
          <Button variant="secondary" onClick={resource.retry}>
            รีเฟรช
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/admin/users">
          <StatCard label="ผู้ใช้ทั้งหมด" value={stats.totalUsers} accent="purple" />
        </Link>
        <StatCard label="คู่รักที่จับคู่แล้ว" value={stats?.totalCouples ?? "-"} accent="rose" />
        <Link href="/admin/coupons">
          <StatCard label="ต้นแบบคูปอง" value={stats.totalTemplates} accent="gray" />
        </Link>
        <Link href="/admin/sets">
          <StatCard label="ชุดคูปอง" value={stats.totalSets} accent="gray" />
        </Link>
        <StatCard label="คูปองที่มอบทั้งหมด (ใบ)" value={stats?.totalGiftedCoupons ?? "-"} accent="blue" />
        <StatCard label="คูปองที่ถูกใช้ (ใบ)" value={stats?.totalUsedCoupons ?? "-"} accent="rose" />
        <StatCard label="คูปองที่หมดอายุ (ชุด)" value={stats?.totalExpiredCoupons ?? "-"} accent="amber" />
      </div>
    </div>
  );
}
