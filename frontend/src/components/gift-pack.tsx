"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { GiftPack as Pack, PackOption, Rarity } from "@/types";
import { LoveTicket } from "./love-ticket";
import { Envelope, StationeryIcon } from "./stationery";
import { TierEnvelope } from "./tier-envelope";
import { Button, Card, ErrorText, Field, Input, LinkButton, RarityBadge, formatDate } from "./ui";

type DrawIntent = { requestId: string; rarity: Rarity; couponTemplateId?: number; couponTemplateIds?: number[]; quantity: number; expectedDrawCount: number };
type Reveal = { options: { option: PackOption; quantity: number }[]; id: string; random: boolean; quantity: number };

export function GiftPack({ initial }: { initial: Pack }) {
  const [pack, setPack] = useState(initial);
  const [tier, setTier] = useState<Rarity>(initial.quotas[0]?.rarity ?? "COMMON");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [busy, setBusy] = useState<"open" | "tier" | "random" | "choose" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [justOpened, setJustOpened] = useState(false);
  const [justTierOpened, setJustTierOpened] = useState<Rarity | null>(null);
  const [randomQuantity, setRandomQuantity] = useState(1);
  const [draft, setDraft] = useState<Record<number, number>>({});
  const [pickQuantity, setPickQuantity] = useState<Record<number, number>>({});
  const [collection, setCollection] = useState(false);
  const [pending, setPending] = useState<DrawIntent | null>(null);
  const [expired, setExpired] = useState(() => new Date(initial.expiresAt).getTime() <= Date.now());
  const lock = useRef(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const openedHeading = useRef<HTMLHeadingElement>(null);
  const tierHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (reveal) resultHeading.current?.focus(); }, [reveal]);
  useEffect(() => { if (justOpened) openedHeading.current?.focus(); }, [justOpened]);
  useEffect(() => {
    const timer = setInterval(() => setExpired(new Date(pack.expiresAt).getTime() <= Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [pack.expiresAt]);
  const complete = pack.draws.length >= pack.total;
  const selectedInTier = pack.draws.filter(d => d.rarity === tier).length;
  const quota = pack.quotas.find(q => q.rarity === tier)?.quantity ?? 0;
  const remaining = quota - selectedInTier;
  const available = pack.options.filter(o => o.coupon.rarity === tier && o.selected < o.limit);
  const tierOpen = pack.openedTiers?.includes(tier) ?? false;
  const draftCount = Object.values(draft).reduce((sum, quantity) => sum + quantity, 0);

  function switchTier(rarity: Rarity) {
    setTier(rarity); setCollection(false); setReveal(null); setExpanded(null); setDraft({}); setRandomQuantity(1);
  }

  async function openTier(rarity: Rarity) {
    if (lock.current) return;
    if (pack.openedTiers?.includes(rarity)) { switchTier(rarity); requestAnimationFrame(() => tierHeading.current?.focus()); return; }
    lock.current = true; setBusy("tier"); setError(null);
    try { setPack(await api.packs.openTier(pack.id, rarity)); switchTier(rarity); setJustTierOpened(rarity); }
    catch (err) { setError(err instanceof ApiError ? err.displayMessage : "เปิดซองระดับนี้ไม่สำเร็จ ลองเปิดอีกครั้งได้นะ"); }
    finally { lock.current = false; setBusy(null); }
  }

  async function open() {
    if (lock.current) return;
    lock.current = true; setBusy("open"); setError(null);
    try { setPack(await api.packs.open(pack.id)); setJustOpened(true); }
    catch (err) { setError(err instanceof ApiError ? err.displayMessage : "เปิดซองไม่สำเร็จ ลองเปิดอีกครั้งได้นะ"); }
    finally { lock.current = false; setBusy(null); }
  }

  async function draw(intent: DrawIntent) {
    if (lock.current) return;
    lock.current = true; setBusy(intent.couponTemplateId || intent.couponTemplateIds ? "choose" : "random"); setError(null); setPending(intent); setReveal(null);
    try {
      const next = await api.packs.draw(pack.id, intent);
      const results = next.draws.filter(d => d.requestId === intent.requestId);
      const options = next.options.flatMap(option => {
        const quantity = results.filter(d => d.couponTemplateId === option.couponTemplateId).length;
        return quantity ? [{ option, quantity }] : [];
      });
      setPack(next); setPending(null); setExpanded(null); setDraft({}); setRandomQuantity(1);
      if (results.length) setReveal({ options, id: intent.requestId, random: results[0].random, quantity: results.length });
    } catch (err) { setError(err instanceof ApiError ? err.displayMessage : "ยังยืนยันผลไม่ได้ ลองคำขอเดิมหรือโหลดซองล่าสุดก่อนเลือกต่อได้นะ"); }
    finally { lock.current = false; setBusy(null); }
  }

  async function reload() {
    if (lock.current) return;
    lock.current = true; setBusy("open");
    try {
      const next = (await api.packs.list()).find(p => p.id === pack.id);
      if (next) { setPack(next); setPending(null); setReveal(null); setDraft({}); setError(null); }
      else setError("ไม่พบซองนี้ กรุณาโหลดหน้าใหม่อีกครั้ง");
    } catch { setError("โหลดซองไม่สำเร็จ กรุณาลองอีกครั้ง"); }
    finally { lock.current = false; setBusy(null); }
  }

  function ticket(option: PackOption, id: string, quantity?: number) {
    return { id, name: option.coupon.name, note: option.coupon.description, terms: option.coupon.terms, rarity: option.coupon.rarity, category: option.coupon.category,
      state: expired ? "expired" as const : "available" as const, expiresAt: pack.expiresAt, quantity };
  }

  if (pack.isSender) return <Card variant="letter" className="space-y-3">
    <p className="pocket-mono">ซองที่เราส่ง · NO. {pack.id}</p><h2>{pack.name}</h2>
    <p>{pack.mode === "FIXED" ? "เราเลือกให้เธอ" : "ให้เธอเลือกหรือสุ่ม"} · {pack.total} ใบ</p>
    <p className="text-sm text-muted">{pack.openedAt ? `แฟนเปิดแล้ว · รับเข้ากระเป๋า ${pack.draws.length}/${pack.total} ใบ` : "ปิดผนึกแล้ว รอแฟนมาเปิด"} · ถึง {formatDate(pack.expiresAt)}</p>
    {pack.message && <p className="font-display whitespace-pre-wrap">{pack.message}</p>}
    <details><summary className="min-h-12 cursor-pointer py-3">ดูคำสัญญาที่เตรียมให้</summary><ul className="pack-review-list">{pack.options.map(o => <li key={o.couponTemplateId}><span>{o.coupon.name}</span><span>{pack.mode === "FIXED" ? "จำนวน" : "สูงสุด"} {o.limit} ใบ</span></li>)}</ul></details>
  </Card>;

  return <section className="pack-receiver space-y-5" aria-label={pack.name} aria-busy={!!busy}>
    <Card variant="letter" className="pack-cover space-y-4 text-center" >
      <p className="pocket-mono">การ์ดจากคนโปรด · NO. {pack.id}</p>
      <h2 ref={openedHeading} tabIndex={-1}>{pack.name}</h2>
      <Envelope open={!!pack.openedAt} animate={justOpened}><span>การ์ดถึงคนโปรด</span><strong>จากใจเรา</strong><span>มีของขวัญมาฝากเธอด้วยนะ</span></Envelope>
      {pack.message && pack.openedAt && <p className="pack-letter-note whitespace-pre-wrap">“{pack.message}”</p>}
      <p className="text-sm text-muted">เลือกและใช้คูปองได้ถึง {formatDate(pack.expiresAt)}</p>
      {!pack.openedAt ? <><p>{pack.mode === "FIXED" ? "ส่งการ์ดใบนี้มาพร้อมชุดคูปองที่ตั้งใจเลือกให้เธอ" : "ส่งการ์ดใบนี้มาพร้อมซองของขวัญแยกตามระดับ ให้เธอเลือกหรือสุ่มได้"}</p><Button disabled={!!busy || expired} onClick={() => void open()}><StationeryIcon name="letter" className="h-5 w-5 shrink-0" />{expired ? "ของขวัญนี้หมดอายุแล้ว" : busy ? "กำลังเปิดการ์ด…" : "เปิดการ์ดและดูของขวัญ"}</Button></>
      : <p role="status">{complete ? `รับครบ ${pack.total} ใบแล้ว เก็บไว้ใช้ด้วยกันนะ` : `ซองเปิดแล้ว · รับเข้ากระเป๋า ${pack.draws.length}/${pack.total} ใบ`}</p>}
    </Card>

    {error && <Card className="space-y-3"><ErrorText message={error} /><div className="flex flex-wrap gap-2">{pending && <Button disabled={!!busy} onClick={() => void draw(pending)}>ลองคำขอเดิมอีกครั้ง</Button>}<Button variant="secondary" disabled={!!busy} onClick={() => void reload()}>โหลดซองล่าสุด</Button></div></Card>}

    {!!pack.openedAt && <>
      {pack.mode === "CHOICE" && <section className="space-y-4" aria-label="ของขวัญที่แฟนจัดมาให้">
        <h3 className="font-display text-xl">ของขวัญในชุดนี้</h3>
        <p className="text-sm text-muted">การ์ดข้อความอยู่ด้านบน ส่วนซองสีเหล่านี้คือสิทธิ์คูปองของเธอ เลือกเปิดระดับที่อยากใช้ก่อนได้เลย</p>
        <div className="tier-envelope-grid">{pack.quotas.map(q => {
          const used = pack.draws.filter(d => d.rarity === q.rarity).length;
          return <TierEnvelope key={q.rarity} rarity={q.rarity} quantity={q.quantity} received={used}
            open={pack.openedTiers?.includes(q.rarity)} animate={justTierOpened === q.rarity}
            active={tier === q.rarity && tierOpen} disabled={!!busy || !!pending || expired || draftCount > 0}
            onOpen={complete ? undefined : () => void openTier(q.rarity)} />;
        })}</div>
      </section>}

      {pack.mode === "CHOICE" && !complete && tierOpen && <Card variant="booklet" className="space-y-4">
        <h3 ref={tierHeading} tabIndex={-1} className="font-display text-lg">เปิดซอง {tier} แล้ว · อยากรับกี่ใบดี?</h3>
        <div className="pack-draw-tray" data-shuffling={busy === "random" || undefined}>
          <div className="pack-card-stack" aria-hidden="true"><span /><span /><span><StationeryIcon name="ticket" /></span></div>
          <div className="min-w-0 space-y-3"><RarityBadge rarity={tier} /><p><strong>เหลือสิทธิ์ {remaining} ใบ</strong> · มี {available.length} แบบให้เลือก</p>
            <Field label="สุ่มครั้งนี้กี่ใบ"><Input type="number" min={1} max={Math.max(1, remaining)} step={1} disabled={!!busy || !!pending} value={randomQuantity} onChange={e => setRandomQuantity(Math.max(1, Math.min(Math.max(1, remaining), Math.trunc(Number(e.target.value) || 1))))} /></Field>
            <Button aria-label={`สุ่ม ${tier} ให้ฉัน ${randomQuantity} ใบ`} disabled={!!busy || !!pending || expired || remaining <= 0 || !available.length || draftCount > 0} onClick={() => void draw({ requestId: crypto.randomUUID(), rarity: tier, quantity: randomQuantity, expectedDrawCount: pack.draws.length })}><StationeryIcon name="gift" className="h-5 w-5 shrink-0" />{busy === "random" ? "กำลังสับตั๋วให้เธอ…" : `สุ่มให้ฉัน ${randomQuantity} ใบ`}</Button>
          </div>
        </div>
        <p className="text-sm text-muted">สุ่มครั้งละ 1 ใบหรือหลายใบก็ได้ หรือจัดรายการที่อยากได้ด้านล่างแล้วกดรับพร้อมกัน ใช้สิทธิ์ตามจำนวนที่รับจริง ผลที่รับแล้วเปลี่ยนไม่ได้ สุ่มเท่ากันทุกแบบที่ยังรับได้</p>
        {expired && <p role="status">ซองหมดอายุแล้ว เลือกเพิ่มไม่ได้ แต่ยังดูสิ่งที่ได้รับได้เสมอ</p>}
      </Card>}

      {reveal && <section key={reveal.id} className="pack-result space-y-3" aria-label="คูปองที่เพิ่งได้รับ">
        <h3 ref={resultHeading} tabIndex={-1} className="font-display text-xl">{reveal.random ? "โชคเลือกให้เธอแล้ว" : "คูปองที่เลือกเป็นของเธอแล้ว"}</h3>
        <p role="status">ได้รับ {reveal.quantity} ใบ บันทึกเข้ากระเป๋าแล้ว</p>
        <div className="pack-ticket-grid">{reveal.options.map(({ option, quantity }) => <div key={option.couponTemplateId} className="pack-result-ticket"><LoveTicket ticket={ticket(option, `LP-${pack.id}-${pack.draws.findIndex(d => d.requestId === reveal.id && d.couponTemplateId === option.couponTemplateId) + 1}`, quantity)} open={expanded === -option.couponTemplateId} onOpen={() => setExpanded(-option.couponTemplateId)} onClose={() => setExpanded(null)}><LinkButton href="/my-coupons">เก็บไว้ในกระเป๋าคูปอง</LinkButton></LoveTicket></div>)}</div>
      </section>}

      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-display text-lg">{pack.mode === "FIXED" || complete || collection ? "คำสัญญาที่เธอได้รับ" : tierOpen ? `เลือก ${tier} ด้วยตัวเอง` : "เลือกเปิดซองของขวัญตามระดับก่อนนะ"}</h3>{pack.mode === "CHOICE" && !complete && <Button variant="secondary" aria-pressed={collection} onClick={() => { setCollection(!collection); setExpanded(null); }}>{collection ? "กลับไปเลือกเพิ่ม" : `ดูที่ได้รับแล้ว (${pack.draws.length})`}</Button>}</div>
      <div className="pack-ticket-grid">{(pack.mode === "FIXED" || complete || collection ? pack.options.filter(o => o.selected > 0) : tierOpen ? available : []).map(o => {
        const choosing = pack.mode === "CHOICE" && !complete && !collection;
        const capacity = Math.max(0, Math.min(o.limit - o.selected - (draft[o.couponTemplateId] ?? 0), remaining - draftCount));
        const count = Math.min(pickQuantity[o.couponTemplateId] ?? 1, capacity);
        return <div key={o.couponTemplateId} className="pack-pool-item">
          <p className="pack-selection-label">{choosing ? `รับแล้ว ${o.selected}/${o.limit} ใบ${draft[o.couponTemplateId] ? ` · รอรับ ${draft[o.couponTemplateId]} ใบ` : ""}` : `รับแล้ว ${o.selected} ใบ`}</p>
          <LoveTicket ticket={ticket(o, `PACK-${pack.id}-${o.couponTemplateId}`, choosing ? undefined : o.selected)} catalog={choosing} open={expanded === o.couponTemplateId} onOpen={() => setExpanded(o.couponTemplateId)} onClose={() => setExpanded(null)}>
            {choosing ? <><Field label={`จำนวน ${o.coupon.name} ที่จะเลือก`}><Input type="number" min={1} max={Math.max(1, capacity)} step={1} value={Math.max(1, count)} disabled={!capacity || !!pending || !!busy} onChange={e => setPickQuantity(previous => ({ ...previous, [o.couponTemplateId]: Math.max(1, Math.min(capacity, Math.trunc(Number(e.target.value) || 1))) }))} /></Field>
              <Button disabled={!!busy || !!pending || expired || count <= 0} onClick={() => { setDraft(previous => ({ ...previous, [o.couponTemplateId]: (previous[o.couponTemplateId] ?? 0) + count })); setExpanded(null); }}>ใส่รายการ {Math.max(1, count)} ใบ</Button></> : <LinkButton href="/my-coupons">ไปใช้คูปองในกระเป๋า</LinkButton>}
          </LoveTicket>
        </div>;
      })}</div>
      {draftCount > 0 && <Card className="pack-composer-summary space-y-3"><h3 className="font-display">รายการที่เธอเลือก · {draftCount} ใบ</h3><ul className="space-y-1">{pack.options.filter(o => draft[o.couponTemplateId]).map(o => <li key={o.couponTemplateId}>{o.coupon.name} ×{draft[o.couponTemplateId]}</li>)}</ul><p className="text-sm text-muted">ยังไม่ใช้สิทธิ์จนกว่าจะกดรับทั้งหมด รายการนี้ใช้สิทธิ์ {tier} {draftCount} ใบ</p><div className="flex flex-wrap gap-2"><Button disabled={!!busy || !!pending || expired} onClick={() => void draw({ requestId: crypto.randomUUID(), rarity: tier, quantity: draftCount, couponTemplateIds: Object.entries(draft).flatMap(([id, quantity]) => Array(quantity).fill(Number(id))), expectedDrawCount: pack.draws.length })}>รับที่เลือก {draftCount} ใบ</Button><Button variant="secondary" disabled={!!busy || !!pending} onClick={() => setDraft({})}>ล้างรายการ</Button></div></Card>}
      {complete && <LinkButton href="/my-coupons"><StationeryIcon name="ticket" className="h-5 w-5 shrink-0" />เปิดกระเป๋าคูปองของฉัน</LinkButton>}
    </>}
  </section>;
}
