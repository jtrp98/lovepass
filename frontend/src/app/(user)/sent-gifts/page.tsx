"use client";

import { useState } from "react";
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

export default function SentGiftsPage() {
  const [isSentTab, setIsSentTab] = useState(false);
  const sentResource = useResource(api.gifts.sent);
  const receivedResource = useResource(api.gifts.received);

  const activeResource = isSentTab ? sentResource : receivedResource;
  const sentGifts = sentResource.data;
  const receivedGifts = receivedResource.data;

  return (
    <div className="pocket-book sent-gifts-page space-y-6">
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
            onClick={() => setIsSentTab(false)}
          >
            ของขวัญที่ได้รับ {receivedGifts ? `(${receivedGifts.length})` : ""}
          </Button>
          <Button
            variant={isSentTab ? "primary" : "secondary"}
            aria-pressed={isSentTab}
            onClick={() => setIsSentTab(true)}
          >
            ของขวัญที่ส่ง {sentGifts ? `(${sentGifts.length})` : ""}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/packs" variant="secondary">
            ดูซองคูปองตามระดับ
          </LinkButton>
          <LinkButton href="/gifts/new">
            มอบของขวัญให้แฟน
          </LinkButton>
        </div>
      </div>

      {activeResource.error ? (
        <ErrorState message={activeResource.error} retry={activeResource.retry} />
      ) : activeResource.loading ? (
        <Skeleton />
      ) : isSentTab ? (
        !sentGifts || sentGifts.length === 0 ? (
          <EmptyState
            action={<LinkButton href="/catalog">เลือกของขวัญให้แฟน</LinkButton>}
            title="ยังไม่เคยมอบของขวัญ"
            hint="เลือกคำสัญญาใบแรก แล้วส่งให้คนพิเศษกันนะ"
          />
        ) : (
          <div className="sent-gift-book space-y-6">
            {sentGifts.map((gift) => (
              <SentGiftCard key={gift.id} gift={gift} />
            ))}
          </div>
        )
      ) : (
        !receivedGifts || receivedGifts.length === 0 ? (
          <EmptyState
            action={<LinkButton href="/catalog">เลือกของขวัญให้แฟน</LinkButton>}
            title="ยังไม่มีของขวัญที่ได้รับ"
            hint="เมื่อแฟนส่งของขวัญและคำสัญญามา จะถูกเก็บรักษาไว้ที่นี่นะ"
          />
        ) : (
          <div className="sent-gift-book space-y-6">
            {receivedGifts.map((gift) => (
              <ReceivedGiftCard key={gift.id} gift={gift} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
