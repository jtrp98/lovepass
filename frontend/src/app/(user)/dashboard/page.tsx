"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, ErrorState, LinkButton, PageTitle, Skeleton, formatDate } from "@/components/ui";
import { api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import Link from "next/link";
import { LoveDoodle } from "@/components/love-doodle";
import { StationeryIcon } from "@/components/stationery";
import { ReceivedGiftDialog } from "@/components/received-gift-dialog";
import type { ReceivedGift } from "@/types";

export default function DashboardPage() {
  const stats = useResource(api.coupons.dashboard),
    couple = useResource(api.couples.me),
    receivedGifts = useResource(api.gifts.received);

  const [activeGift, setActiveGift] = useState<ReceivedGift | null>(null);
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    if (!autoOpenedRef.current && receivedGifts.data && receivedGifts.data.length > 0) {
      const unopened = receivedGifts.data.find((g) => !g.openedAt);
      if (unopened) {
        autoOpenedRef.current = true;
        setActiveGift(unopened);
      }
    }
  }, [receivedGifts.data]);

  const data = stats.data;
  const latestGift = receivedGifts.data?.[0];

  return (
    <div className="space-y-6">
      <PageTitle
        title="บ้านของเรา"
        subtitle={
          couple.data
            ? `สมุดตั๋วของคุณกับ ${couple.data.partnerDisplayName}`
            : "ความสุขเล็ก ๆ ที่ให้กันได้ทุกวัน"
        }
      />
      {couple.error ? (
        <ErrorState message={couple.error} retry={couple.retry} />
      ) : couple.loading ? (
        <Skeleton />
      ) : couple.data === null ? (
        <Card variant="journal" className="journal-welcome space-y-3">
          <LoveDoodle />
          <h2 className="text-xl">เริ่มสมุดตั๋วของสองเรา</h2>
          <p>ชวนแฟนมาใช้ด้วยกัน แล้วเริ่มมอบคำสัญญาเล็ก ๆ ให้กัน</p>
          <LinkButton href="/couple">ชวนแฟนมาใช้ด้วยกัน</LinkButton>
        </Card>
      ) : stats.error ? (
        <ErrorState message={stats.error} retry={stats.retry} />
      ) : stats.loading ? (
        <Skeleton />
      ) : (
        <Card variant="journal" className="journal-welcome space-y-3">
          <LoveDoodle />
          <h2 className="text-xl">
            {data?.pendingRequests
              ? "มีคำขอที่รอคุณยืนยัน"
              : data?.expiringSoon
                ? "อย่าลืมใช้ความสุขก่อนหมดอายุ"
                : data?.receivedCoupons
                  ? "วันนี้อยากใช้คูปองใบไหนดี?"
                  : "ส่งความสุขใบแรกให้แฟน"}
          </h2>
          <p>
            {data?.pendingRequests
              ? `มี ${data.pendingRequests} คำขอ เปิดดูรายละเอียดก่อนให้ใช้สิทธิ์`
              : "เลือกเวลาที่ใช่ แล้วทำตามคำสัญญาของสองเรา"}
          </p>
          <LinkButton
            href={data?.pendingRequests ? "/requests" : data?.receivedCoupons ? "/my-coupons" : "/catalog"}
          >
            {data?.pendingRequests
              ? "พิจารณาคำขอ"
              : data?.receivedCoupons
                ? "ดูคูปองของฉัน"
                : "เลือกของขวัญให้แฟน"}
          </LinkButton>
        </Card>
      )}

      {latestGift && (
        <Card variant="letter" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="pocket-mono text-xs text-muted">ของขวัญล่าสุดจาก {latestGift.senderName}</p>
              <h2 className="text-lg font-semibold">{latestGift.title || "ของขวัญจากใจ"}</h2>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveGift(latestGift)}
            >
              <StationeryIcon name="letter" className="h-4 w-4 shrink-0" />
              {!latestGift.openedAt ? "เปิดซองของขวัญ" : "เปิดดูการ์ดของขวัญ"}
            </Button>
          </div>
          {latestGift.message && (
            <p className="font-display text-sm italic text-muted line-clamp-2">
              “{latestGift.message}”
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between text-xs text-muted">
            <span>
              ได้รับเมื่อ {formatDate(latestGift.createdAt)} · รวม {latestGift.coupons.reduce((sum, c) => sum + c.quantity, 0)} ใบ
            </span>
            <Link href="/sent-gifts" className="text-love hover:underline">
              ดูประวัติของขวัญทั้งหมด →
            </Link>
          </div>
        </Card>
      )}

      <section className="space-y-3" aria-label="ข้อมูลคูปองล่าสุด">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2>ตั๋วของเรา</h2>
          <Button variant="ghost" disabled={stats.loading} onClick={stats.retry}>
            รีเฟรชข้อมูล
          </Button>
        </div>
        {stats.error ? (
          couple.data ? null : (
            <ErrorState message={stats.error} retry={stats.retry} />
          )
        ) : stats.loading ? (
          <Skeleton />
        ) : (
          data && (
            <dl className="journal-stats grid grid-cols-2 gap-3 border border-line p-4 sm:grid-cols-4">
              {[
                { label: "ได้รับแล้ว", value: data.receivedCoupons, href: "/my-coupons" },
                { label: "ใช้ไปแล้ว", value: data.usedCoupons, href: "/history" },
                { label: "ใกล้หมดอายุ", value: data.expiringSoon, href: "/my-coupons" },
                { label: "คำขอรอพิจารณา", value: data.pendingRequests, href: "/requests" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-sm text-muted">{item.label}</dt>
                  <dd>
                    <Link
                      className="inline-flex min-h-12 items-center text-xl font-semibold text-love"
                      href={item.href}
                    >
                      {item.value}
                    </Link>
                  </dd>
                </div>
              ))}
            </dl>
          )
        )}
      </section>

      <Card variant="letter" className="space-y-2">
        <h2>ความใส่ใจไม่ต้องรอวันพิเศษ</h2>
        <p>เลือกคูปองเอง หรือเลือกชุดที่เตรียมไว้ แล้วตรวจของขวัญก่อนส่ง</p>
        <LinkButton href="/catalog" variant="secondary">
          เลือกของขวัญให้แฟน
        </LinkButton>
      </Card>

      {activeGift && (
        <ReceivedGiftDialog
          gift={activeGift}
          onClose={() => setActiveGift(null)}
          onOpened={(updated) => {
            setActiveGift(updated);
            receivedGifts.retry();
            stats.retry();
          }}
        />
      )}
    </div>
  );
}
