"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Button,
  LinkButton,
  ErrorState,
  Skeleton,
  EmptyState,
} from "@/components/ui";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";
import { SentGiftCard } from "@/components/sent-gift-card";
import { ReceivedGiftCard } from "@/components/received-gift-card";
import { ReceivedGiftDialog } from "@/components/received-gift-dialog";
import { GiftPack } from "@/components/gift-pack";
import type { ReceivedGift, SentGift, GiftPack as GiftPackType } from "@/types";

type UnifiedReceived =
  | { type: "coupon"; id: number; createdAt: string; gift: ReceivedGift }
  | { type: "pack"; id: number; createdAt: string; pack: GiftPackType };

type UnifiedSent =
  | { type: "coupon"; id: number; createdAt: string; gift: SentGift }
  | { type: "pack"; id: number; createdAt: string; pack: GiftPackType };

type FilterSource = "ALL" | "COUPON" | "TIER";

function GiftsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "sent";
  const [isSentTab, setIsSentTab] = useState(initialTab);
  const [filter, setFilter] = useState<FilterSource>("ALL");
  const [activeGift, setActiveGift] = useState<ReceivedGift | null>(null);

  const sentResource = useResource(api.gifts.sent);
  const receivedResource = useResource(api.gifts.received);
  const packsResource = useResource(api.packs.list);

  const loading =
    (isSentTab ? sentResource.loading : receivedResource.loading) ||
    packsResource.loading;

  const error =
    (isSentTab ? sentResource.error : receivedResource.error) ||
    packsResource.error;

  const retry = () => {
    void sentResource.retry();
    void receivedResource.retry();
    void packsResource.retry();
  };

  const sentCoupons = sentResource.data ?? [];
  const receivedCoupons = receivedResource.data ?? [];
  const packs = packsResource.data ?? [];

  const receivedPacks = useMemo(
    () => packs.filter((p) => !p.isSender),
    [packs],
  );
  const sentPacks = useMemo(
    () => packs.filter((p) => p.isSender),
    [packs],
  );

  const allReceived: UnifiedReceived[] = useMemo(() => {
    const list: UnifiedReceived[] = [
      ...receivedCoupons.map((g) => ({
        type: "coupon" as const,
        id: g.id,
        createdAt: g.createdAt,
        gift: g,
      })),
      ...receivedPacks.map((p) => ({
        type: "pack" as const,
        id: p.id,
        createdAt: p.createdAt || p.expiresAt || new Date().toISOString(),
        pack: p,
      })),
    ];
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [receivedCoupons, receivedPacks]);

  const allSent: UnifiedSent[] = useMemo(() => {
    const list: UnifiedSent[] = [
      ...sentCoupons.map((g) => ({
        type: "coupon" as const,
        id: g.id,
        createdAt: g.createdAt,
        gift: g,
      })),
      ...sentPacks.map((p) => ({
        type: "pack" as const,
        id: p.id,
        createdAt: p.createdAt || p.expiresAt || new Date().toISOString(),
        pack: p,
      })),
    ];
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [sentCoupons, sentPacks]);

  const currentReceived = useMemo(() => {
    if (filter === "COUPON") return allReceived.filter((i) => i.type === "coupon");
    if (filter === "TIER") return allReceived.filter((i) => i.type === "pack");
    return allReceived;
  }, [allReceived, filter]);

  const currentSent = useMemo(() => {
    if (filter === "COUPON") return allSent.filter((i) => i.type === "coupon");
    if (filter === "TIER") return allSent.filter((i) => i.type === "pack");
    return allSent;
  }, [allSent, filter]);

  const totalReceivedCount = allReceived.length;
  const totalSentCount = allSent.length;

  return (
    <div className="pocket-book gifts-page space-y-6">
      <header className="pocket-intro">
        <div>
          <p className="pocket-mono">
            <span className="pocket-foil" aria-hidden="true" />
            LITTLE GIFTS WE SHARE
          </p>
          <h1 tabIndex={-1}>ของขวัญของสองเรา</h1>
          <p>เก็บทุกคำสัญญาและความใส่ใจ ทั้งที่ได้รับและที่ตั้งใจส่งให้เธอ</p>
        </div>
        <div className="pocket-seal" aria-hidden="true">
          <small>{isSentTab ? "GIVEN" : "RECEIVED"}</small>
          <span>with love</span>
          <small>FOR US</small>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="หมวดหมู่ของขวัญ">
          <Button
            variant={!isSentTab ? "primary" : "secondary"}
            aria-pressed={!isSentTab}
            onClick={() => {
              setIsSentTab(false);
              setFilter("ALL");
            }}
          >
            ของขวัญที่ได้รับ {totalReceivedCount ? `(${totalReceivedCount})` : ""}
          </Button>
          <Button
            variant={isSentTab ? "primary" : "secondary"}
            aria-pressed={isSentTab}
            onClick={() => {
              setIsSentTab(true);
              setFilter("ALL");
            }}
          >
            ของขวัญที่ส่ง {totalSentCount ? `(${totalSentCount})` : ""}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/gifts/new">
            มอบของขวัญให้แฟน
          </LinkButton>
          <LinkButton href="/packs/new" variant="secondary">
            จัดซองตามระดับ
          </LinkButton>
        </div>
      </div>

      {/* Quick filter pills */}
      <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="กรองประเภทของขวัญ">
        <span className="text-xs text-muted">ตัวกรอง:</span>
        <button
          type="button"
          aria-pressed={filter === "ALL"}
          className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors ${
            filter === "ALL"
              ? "border-love bg-love-soft font-semibold text-love"
              : "border-control bg-surface text-muted hover:border-love"
          }`}
          onClick={() => setFilter("ALL")}
        >
          ทั้งหมด ({isSentTab ? totalSentCount : totalReceivedCount})
        </button>
        <button
          type="button"
          aria-pressed={filter === "COUPON"}
          className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors ${
            filter === "COUPON"
              ? "border-love bg-love-soft font-semibold text-love"
              : "border-control bg-surface text-muted hover:border-love"
          }`}
          onClick={() => setFilter("COUPON")}
        >
          จากคูปอง ({isSentTab ? sentCoupons.length : receivedCoupons.length})
        </button>
        <button
          type="button"
          aria-pressed={filter === "TIER"}
          className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors ${
            filter === "TIER"
              ? "border-love bg-love-soft font-semibold text-love"
              : "border-control bg-surface text-muted hover:border-love"
          }`}
          onClick={() => setFilter("TIER")}
        >
          จากระดับ tier ({isSentTab ? sentPacks.length : receivedPacks.length})
        </button>
      </div>

      {error ? (
        <ErrorState message={error} retry={retry} />
      ) : loading && (!sentResource.data && !receivedResource.data && !packsResource.data) ? (
        <Skeleton />
      ) : isSentTab ? (
        currentSent.length === 0 ? (
          <EmptyState
            action={
              <div>
                <LinkButton href="/catalog">เลือกของขวัญให้แฟน</LinkButton>
                <span className="sr-only">ยังไม่เคยมอบคูปอง</span>
              </div>
            }
            title="ยังไม่เคยมอบของขวัญ"
            hint="เลือกคำสัญญาใบแรก หรือจัดซองตามระดับ แล้วส่งให้คนพิเศษกันนะ"
          />
        ) : (
          <div className="sent-gift-book space-y-6">
            {currentSent.map((item) =>
              item.type === "coupon" ? (
                <SentGiftCard key={`coupon-${item.id}`} gift={item.gift} />
              ) : (
                <GiftPack key={`pack-${item.id}`} initial={item.pack} />
              ),
            )}
          </div>
        )
      ) : currentReceived.length === 0 ? (
        <EmptyState
          action={<LinkButton href="/catalog">เลือกของขวัญให้แฟน</LinkButton>}
          title="ยังไม่มีของขวัญที่ได้รับ"
          hint="เมื่อแฟนส่งของขวัญหรือซองคำสัญญามา จะถูกเก็บรักษาไว้ที่นี่นะ"
        />
      ) : (
        <div className="sent-gift-book space-y-6">
          {currentReceived.map((item) =>
            item.type === "coupon" ? (
              <ReceivedGiftCard
                key={`coupon-${item.id}`}
                gift={item.gift}
                onOpenDetail={(g) => setActiveGift(g)}
              />
            ) : (
              <GiftPack key={`pack-${item.id}`} initial={item.pack} />
            ),
          )}
        </div>
      )}

      {activeGift && (
        <ReceivedGiftDialog
          gift={activeGift}
          onClose={() => setActiveGift(null)}
          onOpened={(updated) => {
            setActiveGift(updated);
            void receivedResource.retry();
          }}
        />
      )}
    </div>
  );
}

export default function GiftsPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <GiftsContent />
    </Suspense>
  );
}
