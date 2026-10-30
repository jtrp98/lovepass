"use client";

import {
  LinkButton,
  ErrorState,
  Skeleton,
  EmptyState,
} from "@/components/ui";
import { useResource } from "@/lib/use-resource";
import { api } from "@/lib/api";
import { SentGiftCard } from "@/components/sent-gift-card";

export default function SentGiftsPage() {
  const resource = useResource(api.gifts.sent);
  const gifts = resource.data;

  return (
    <div className="pocket-book sent-gifts-page space-y-6">
      <header className="pocket-intro">
        <div>
          <p className="pocket-mono"><span className="pocket-foil" aria-hidden="true" />LITTLE GIFTS WE HAVE GIVEN</p>
          <h1 tabIndex={-1}>คูปองที่เคยมอบ</h1>
          <p>เก็บทุกคำสัญญา ที่ตั้งใจส่งให้เธอ</p>
        </div>
        <div className="pocket-seal" aria-hidden="true"><small>GIVEN</small><span>with love</span><small>JUST FOR YOU</small></div>
      </header>
      <LinkButton href="/packs" variant="secondary">ดูซองคูปองที่ส่งและได้รับ</LinkButton>

      {resource.error ? (
        <ErrorState message={resource.error} retry={resource.retry} />
      ) : resource.loading || !gifts ? (
        <Skeleton />
      ) : gifts.length === 0 ? (
        <EmptyState
          action={<LinkButton href="/catalog">เลือกของขวัญให้แฟน</LinkButton>}
          title="ยังไม่เคยมอบคูปอง"
          hint="เลือกคำสัญญาใบแรก แล้วส่งให้คนพิเศษกันนะ"
        />
      ) : (
        <div className="sent-gift-book">
          {gifts.map((gift) => (
            <SentGiftCard key={gift.id} gift={gift} />
          ))}
        </div>
      )}
    </div>
  );
}
