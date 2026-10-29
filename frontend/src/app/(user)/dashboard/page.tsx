"use client";

import { Button, Card, ErrorText, PageTitle, StatCard } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CoupleInfo, Dashboard as DashboardData } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [couple, setCouple] = useState<CoupleInfo | null | undefined>(undefined); // undefined = loading
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.coupons.dashboard().then(setStats).catch(() => setStats(null));
    api.couples
      .me()
      .then(setCouple)
      .catch((err) => {
        setCouple(undefined);
        setError(err instanceof ApiError ? err.displayMessage : null);
      });
  }, []);

  return (
    <div className="space-y-6">
      <PageTitle title="Dashboard" subtitle="ภาพรวมคูปองรักของเรา" />

      {couple === null ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-rose-200 bg-rose-50">
          <div>
            <p className="font-semibold text-rose-700">ยังไม่ได้จับคู่ 💞</p>
            <p className="text-sm text-rose-600">จับคู่กับแฟนก่อน ถึงจะมอบคูปองให้กันได้</p>
          </div>
          <Link href="/couple">
            <Button>ไปจับคู่</Button>
          </Link>
        </Card>
      ) : null}

      {error ? <ErrorText message={error} /> : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="คูปองที่ได้รับ (ใบ)" value={stats?.receivedCoupons ?? "-"} accent="rose" />
        <StatCard label="ใช้ไปแล้ว (ครั้ง)" value={stats?.usedCoupons ?? "-"} accent="blue" />
        <StatCard label="ใกล้หมดอายุ (ชุด)" value={stats?.expiringSoon ?? "-"} accent="amber" />
        <StatCard label="คำขอรอพิจารณา" value={stats?.pendingRequests ?? "-"} accent="purple" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/gifts/new">
          <Card className="h-full transition hover:border-rose-300 hover:shadow-md">
            <p className="text-2xl">🎁</p>
            <p className="mt-2 font-semibold">มอบคูปองให้แฟน</p>
            <p className="text-sm text-gray-500">เลือกทีละใบ หรือจัดชุดเองก็ได้</p>
          </Card>
        </Link>
        <Link href="/my-coupons">
          <Card className="h-full transition hover:border-rose-300 hover:shadow-md">
            <p className="text-2xl">🎟️</p>
            <p className="mt-2 font-semibold">คูปองของฉัน</p>
            <p className="text-sm text-gray-500">ดูคูปองที่ได้รับและขอใช้สิทธิ์</p>
          </Card>
        </Link>
        <Link href="/requests">
          <Card className="h-full transition hover:border-rose-300 hover:shadow-md">
            <p className="text-2xl">💌</p>
            <p className="mt-2 font-semibold">คำขอใช้คูปอง</p>
            <p className="text-sm text-gray-500">อนุมัติหรือปฏิเสธคำขอของแฟน</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
