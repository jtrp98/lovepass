"use client";

import { PageTitle, StatCard } from "@/components/ui";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { AdminStats } from "@/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.admin
      .stats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="space-y-6">
      <PageTitle title="ภาพรวมระบบ" subtitle="สถิติทั้งหมดแบบเรียลไทม์จากฐานข้อมูล" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="ผู้ใช้ทั้งหมด" value={stats?.totalUsers ?? "-"} accent="purple" />
        <StatCard label="คู่รัก (Active)" value={stats?.totalCouples ?? "-"} accent="rose" />
        <StatCard label="Coupon Templates" value={stats?.totalTemplates ?? "-"} accent="gray" />
        <StatCard label="Coupon Sets" value={stats?.totalSets ?? "-"} accent="gray" />
        <StatCard label="คูปองที่มอบทั้งหมด (ใบ)" value={stats?.totalGiftedCoupons ?? "-"} accent="blue" />
        <StatCard label="คูปองที่ถูกใช้ (ใบ)" value={stats?.totalUsedCoupons ?? "-"} accent="rose" />
        <StatCard label="คูปองที่หมดอายุ (ชุด)" value={stats?.totalExpiredCoupons ?? "-"} accent="amber" />
      </div>
    </div>
  );
}
