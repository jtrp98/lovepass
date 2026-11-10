"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, ErrorState, LinkButton, PageTitle, Skeleton, formatDate } from "@/components/ui";
import { api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";
import { LoveDoodle } from "@/components/love-doodle";
import { StationeryIcon, type StationeryIconName } from "@/components/stationery";
import { ReceivedGiftDialog } from "@/components/received-gift-dialog";
import type { GiftPack, ReceivedGift } from "@/types";

const loadMyCoupons = () => api.coupons.my();

type LatestGiftItem =
  | { type: "coupon"; createdAt: string; gift: ReceivedGift }
  | { type: "pack"; createdAt: string; pack: GiftPack };

export default function DashboardPage() {
  const stats = useResource(api.coupons.dashboard),
    couple = useResource(api.couples.me),
    receivedGifts = useResource(api.gifts.received),
    packs = useResource(api.packs.list),
    coupons = useResource(loadMyCoupons);

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

  // Find the truly latest received gift across coupon gifts and tier packs
  const latestItem: LatestGiftItem | null = useMemo(() => {
    const list: LatestGiftItem[] = [];
    if (receivedGifts.data?.[0]) {
      list.push({
        type: "coupon",
        createdAt: receivedGifts.data[0].createdAt,
        gift: receivedGifts.data[0],
      });
    }
    const receivedPacks = (packs.data || []).filter((p) => !p.isSender);
    if (receivedPacks[0]) {
      list.push({
        type: "pack",
        createdAt: receivedPacks[0].createdAt || receivedPacks[0].expiresAt || new Date().toISOString(),
        pack: receivedPacks[0],
      });
    }
    if (list.length === 0) return null;
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list[0];
  }, [receivedGifts.data, packs.data]);

  const refreshAll = () => {
    void stats.retry();
    void couple.retry();
    void receivedGifts.retry();
    void packs.retry();
    void coupons.retry();
  };

  const activeCoupons = (coupons.data || [])
    .filter((c) => c.available > 0)
    .slice(0, 3);

  const statItems: {
    label: string;
    value: number;
    href: string;
    icon: StationeryIconName;
    unit: string;
  }[] = [
    { label: "ได้รับแล้ว", value: data?.receivedCoupons ?? 0, href: "/my-coupons", icon: "ticket", unit: "ใบ" },
    { label: "ใช้ไปแล้ว", value: data?.usedCoupons ?? 0, href: "/history", icon: "check", unit: "ใบ" },
    { label: "ใกล้หมดอายุ", value: data?.expiringSoon ?? 0, href: "/my-coupons", icon: "hourglass", unit: "ใบ" },
    { label: "คำขอรอพิจารณา", value: data?.pendingRequests ?? 0, href: "/requests", icon: "letter", unit: "คำขอ" },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        title="บ้านของเรา"
        subtitle={
          couple.data
            ? `สมุดตั๋วของคุณกับ ${couple.data.partnerDisplayName}`
            : "ความสุขเล็ก ๆ ที่ให้กันได้ทุกวัน"
        }
        action={
          couple.data ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={stats.loading || coupons.loading || receivedGifts.loading || packs.loading}
              onClick={refreshAll}
              aria-label="รีเฟรชข้อมูล"
            >
              รีเฟรช
            </Button>
          ) : undefined
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* คอลัมน์หลัก (ซ้าย): บันทึกต้อนรับและตั๋วพร้อมใช้ */}
          <div className="space-y-6 lg:col-span-7">
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

            {/* ตั๋วพร้อมใช้ในสมุด */}
            <section className="space-y-3" aria-label="ตั๋วพร้อมใช้ในสมุด">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">ตั๋วพร้อมใช้ในสมุด</h2>
                {(data?.receivedCoupons ?? 0) > 0 && (
                  <Link href="/my-coupons" className="inline-flex items-center gap-1 text-sm text-love hover:underline">
                    ดูทั้งหมด ({data?.receivedCoupons}) <LuArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
              {coupons.loading ? (
                <div className="space-y-2">
                  <div className="h-12 rounded bg-love-soft/60 motion-safe:animate-pulse" />
                  <div className="h-12 rounded bg-love-soft/60 motion-safe:animate-pulse" />
                </div>
              ) : activeCoupons.length > 0 ? (
                <ul className="dashboard-preview-tickets" aria-label="รายการตั๋วพร้อมใช้">
                  {activeCoupons.map((coupon) => (
                    <li key={coupon.id}>
                      <Link
                        href="/my-coupons"
                        className="mini-ticket flex min-h-12 w-full items-center justify-between rounded transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-love"
                        data-rarity={coupon.rarity}
                      >
                        <span className="mini-ticket-name truncate">{coupon.name}</span>
                        <span className="mini-ticket-status shrink-0">
                          {coupon.expiringSoon ? "ใกล้หมดอายุ · " : ""}พร้อมใช้ {coupon.available} ใบ
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (data?.receivedCoupons ?? 0) > 0 ? (
                <Card variant="paper" className="p-4 text-center text-sm text-muted">
                  <p>ใช้คูปองที่มีครบหมดแล้ว รอแฟนส่งของขวัญใหม่มาให้นะ ♡</p>
                </Card>
              ) : (
                <Card variant="paper" className="space-y-2 p-4 text-center">
                  <p className="text-sm text-muted">ยังไม่มีตั๋วในสมุด เริ่มส่งความสุขให้กันใบแรกเลยไหม?</p>
                  <LinkButton href="/catalog" variant="secondary">
                    เลือกของขวัญให้แฟน
                  </LinkButton>
                </Card>
              )}
            </section>
          </div>

          {/* คอลัมน์รอง (ขวา): ของขวัญล่าสุดและสรุปตั๋วในสมุด */}
          <div className="space-y-6 lg:col-span-5">
            {latestItem && (
              <Card variant="letter" className="space-y-3">
                {latestItem.type === "coupon" ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="pocket-mono text-xs text-muted">
                          ของขวัญล่าสุดจาก {latestItem.gift.senderName}
                        </p>
                        <h2 className="text-lg font-semibold">
                          {latestItem.gift.title || "ของขวัญจากใจ"}
                        </h2>
                      </div>
                      <Button
                        variant={!latestItem.gift.openedAt ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setActiveGift(latestItem.gift)}
                      >
                        <StationeryIcon name="letter" className="h-4 w-4 shrink-0" />
                        {!latestItem.gift.openedAt ? "เปิดซองของขวัญ" : "เปิดดูการ์ดของขวัญ"}
                      </Button>
                    </div>
                    {latestItem.gift.message && (
                      <p className="font-display text-sm italic text-muted line-clamp-2">
                        “{latestItem.gift.message}”
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-between text-xs text-muted">
                      <span>
                        ได้รับเมื่อ {formatDate(latestItem.gift.createdAt)} · รวม{" "}
                        {latestItem.gift.coupons.reduce((sum, c) => sum + c.quantity, 0)} ใบ
                      </span>
                      <Link href="/gifts" className="inline-flex items-center gap-1 text-love hover:underline">
                        ดูของขวัญทั้งหมด <LuArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="pocket-mono text-xs text-muted">
                          ซองของขวัญตามระดับจาก {latestItem.pack.senderName || couple.data?.partnerDisplayName || "แฟน"}
                        </p>
                        <h2 className="text-lg font-semibold">{latestItem.pack.name}</h2>
                      </div>
                      <LinkButton
                        href="/gifts"
                        variant={!latestItem.pack.openedAt ? "primary" : "secondary"}
                        className="text-sm"
                      >
                        <StationeryIcon name="letter" className="h-4 w-4 shrink-0" />
                        {!latestItem.pack.openedAt ? "เปิดซองของขวัญ" : "เปิดดูของขวัญ"}
                      </LinkButton>
                    </div>
                    {latestItem.pack.message && (
                      <p className="font-display text-sm italic text-muted line-clamp-2">
                        “{latestItem.pack.message}”
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-between text-xs text-muted">
                      <span>
                        รวม {latestItem.pack.total} สิทธิ์ ({latestItem.pack.draws.length}/{latestItem.pack.total} ใบที่เลือกแล้ว)
                      </span>
                      <Link href="/gifts" className="inline-flex items-center gap-1 text-love hover:underline">
                        ดูของขวัญทั้งหมด <LuArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </>
                )}
              </Card>
            )}

            {/* แผงสรุปตั๋วในสมุด (Stats) */}
            <section className="space-y-3" aria-label="สรุปตั๋วในสมุด">
              <h2 className="text-lg font-semibold">สรุปตั๋วในสมุด</h2>
              {data && (
                <dl className="journal-stats grid grid-cols-2 gap-2 border border-line p-3 sm:grid-cols-4 lg:grid-cols-2">
                  {statItems.map((item) => (
                    <div key={item.label}>
                      <Link
                        href={item.href}
                        className="group flex min-h-[76px] flex-col justify-between rounded p-2.5 transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-love"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <dt className="text-xs text-muted sm:text-sm">{item.label}</dt>
                          <StationeryIcon
                            name={item.icon}
                            className="h-4 w-4 shrink-0 text-muted/60 transition-colors group-hover:text-love"
                          />
                        </div>
                        <dd className="mt-1 flex items-baseline gap-1">
                          <span className="text-xl font-bold text-love sm:text-2xl">{item.value}</span>
                          <span className="text-xs text-muted">{item.unit}</span>
                        </dd>
                      </Link>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          </div>
        </div>
      )}

      {activeGift && (
        <ReceivedGiftDialog
          gift={activeGift}
          onClose={() => setActiveGift(null)}
          onOpened={(updated) => {
            setActiveGift(updated);
            void receivedGifts.retry();
            void stats.retry();
            void coupons.retry();
          }}
        />
      )}
    </div>
  );
}
