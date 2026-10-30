"use client";
import { useState } from "react";
import { GiftPack } from "@/components/gift-pack";
import { GiftViews } from "@/components/nav";
import { Button, EmptyState, ErrorState, LinkButton, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

export default function PacksPage() {
  const resource = useResource(api.packs.list);
  const [sent, setSent] = useState(false);
  const packs = resource.data?.filter(p => p.isSender === sent);
  return <div className="pack-page space-y-6">
    <header className="pocket-intro"><div><p className="pocket-mono">A CARD AND A GIFT, JUST FOR YOU</p><h1>ของขวัญที่ส่งให้กัน</h1><p>การ์ดจากใจ พร้อมชุดคูปองหรือซองของขวัญตามระดับ</p></div><LinkButton href="/packs/new">จัดชุดให้แฟน</LinkButton></header>
    <GiftViews />
    <div className="flex flex-wrap gap-3" role="group" aria-label="ซองคูปอง"><Button variant={!sent ? "primary" : "secondary"} aria-pressed={!sent} onClick={() => { setSent(false); resource.retry(); }}>ซองที่ได้รับ</Button><Button variant={sent ? "primary" : "secondary"} aria-pressed={sent} onClick={() => { setSent(true); resource.retry(); }}>ซองที่เราส่ง</Button></div>
    {resource.error ? <ErrorState message={resource.error} retry={resource.retry} /> : resource.loading || !packs ? <Skeleton /> : !packs.length ? <EmptyState title={sent ? "ยังไม่มีซองที่ส่ง" : "ยังไม่มีซองมาถึง"} hint="เริ่มจากส่งคำสัญญาเล็ก ๆ ให้คนพิเศษสักซองนะ" action={<LinkButton href="/packs/new">จัดซองแรกของเรา</LinkButton>} /> : <div className="space-y-10">{packs.map(p => <GiftPack key={p.id} initial={p} />)}</div>}
  </div>;
}
