"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { defaultExpiry, expiryInstant, localDate } from "@/lib/flow";
import { Button, Card, ErrorState, ErrorText, Field, Input, LinkButton, Notice, Select, Skeleton, Textarea, rarityStyles, formatDate } from "./ui";
import { LoveTicket } from "./love-ticket";
import { Envelope, StationeryIcon } from "./stationery";
import { TierEnvelope } from "./tier-envelope";
import type { CouponTemplate, GiftPack, Rarity } from "@/types";

const rarities = Object.keys(rarityStyles) as Rarity[];
const load = async () => {
  const [templates, couple, sets] = await Promise.all([api.catalog.templates(), api.couples.me(), api.catalog.sets()]);
  return { templates, couple, sets };
};

export function PackComposer() {
  const resource = useResource(load);
  const [mode, setMode] = useState<GiftPack["mode"]>("CHOICE");
  const [name, setName] = useState("ซองคำสัญญาสำหรับเธอ");
  const [message, setMessage] = useState("");
  const [expiry, setExpiry] = useState(defaultExpiry);
  const [limits, setLimits] = useState<Record<number, number>>({});
  const [quotas, setQuotas] = useState<Partial<Record<Rarity, number>>>({ COMMON: 10 });
  const [filter, setFilter] = useState<Rarity | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [opened, setOpened] = useState<number | null>(null);
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GiftPack | null>(null);
  const lock = useRef(false);
  const intent = useRef<{ body: string; id: string } | null>(null);

  if (resource.error) return <ErrorState message={resource.error} retry={resource.retry} />;
  if (!resource.data) return <Skeleton />;
  const { templates, couple, sets } = resource.data;
  if (!couple) return <Card variant="letter" className="space-y-3"><h2>จับมือกันก่อนส่งซอง</h2><p>เชื่อมบัญชีกับแฟน แล้วกลับมาจัดซองให้กันนะ</p><LinkButton href="/couple">ไปจับคู่กับแฟน</LinkButton></Card>;
  const selected = templates.filter(t => limits[t.id] > 0);
  const total = mode === "FIXED" ? selected.reduce((n, t) => n + limits[t.id], 0) : rarities.reduce((n, r) => n + (quotas[r] ?? 0), 0);
  const birthday = sets.find(s => s.name === "วันเกิดนี้ มีเราให้ทั้งปี");

  function changeLimit(template: CouponTemplate, value: number) {
    const count = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.trunc(value))) : 0;
    setLimits(previous => ({ ...previous, [template.id]: count }));
  }

  function validate() {
    if (!name.trim()) return "ตั้งชื่อซองให้เธอหน่อยนะ";
    if (!expiryInstant(expiry)) return "เลือกวันหมดอายุตั้งแต่วันนี้เป็นต้นไปนะ";
    if (total < 1 || total > 100) return "กำหนดจำนวนรวม 1–100 ใบก่อนนะ";
    if (mode === "FIXED" && !selected.length) return "เลือกคูปองที่จะมอบให้แฟนก่อนนะ";
    if (mode === "CHOICE") {
      for (const rarity of rarities) {
        if (quotas[rarity] && !templates.some(t => t.rarity === rarity)) return `ระดับ ${rarity} ยังไม่มีคูปองให้รับ เลือกระดับอื่นก่อนนะ`;
      }
    }
    return null;
  }

  async function send() {
    if (lock.current) return;
    const invalid = validate();
    if (invalid) { setError(invalid); return; }
    const payload = { receiverId: couple!.partnerUserId, name: name.trim(), mode, message: message || undefined, expiresAt: expiryInstant(expiry)!,
      options: mode === "FIXED" ? selected.map(t => ({ couponTemplateId: t.id, limit: limits[t.id] })) : [],
      quotas: mode === "FIXED" ? [] : rarities.filter(r => quotas[r]).map(r => ({ rarity: r, quantity: quotas[r]! })) };
    const body = JSON.stringify(payload);
    if (intent.current?.body !== body) intent.current = { body, id: crypto.randomUUID() };
    lock.current = true; setBusy(true); setError(null);
    try { setResult(await api.packs.create({ ...payload, requestId: intent.current!.id })); }
    catch (err) { setError(err instanceof ApiError ? err.displayMessage : "ส่งซองไม่สำเร็จ ลองส่งอีกครั้งได้โดยไม่สร้างซองซ้ำนะ"); }
    finally { lock.current = false; setBusy(false); }
  }

  if (result) return <Card variant="letter" className="pack-sent space-y-4 text-center">
    <Envelope><span>ถึง {couple.partnerDisplayName}</span><strong>{result.total} ใบ</strong><span>จากคนที่รักเธอ</span></Envelope>
    <Notice>ส่งซองให้แฟนแล้ว</Notice><h2>{result.name}</h2><p>รอเธอมาแกะตราครั่ง แล้วเปิดรับคำสัญญาของเรา</p>
    <LinkButton href="/packs">ดูซองของเรา</LinkButton>
  </Card>;

  if (review) return <Card variant="letter" className="space-y-5">
    <p className="pocket-mono">ตรวจการ์ด และของขวัญในชุด</p><h2>{name}</h2>
    <p>ถึง {couple.partnerDisplayName} · {mode === "FIXED" ? "ชุดคูปองที่เราเลือกให้" : "ชุดซองคูปองตามระดับ"} · รวม {total} ใบ</p>
    {message && <p className="font-display whitespace-pre-wrap">“{message}”</p>}
    <p>ใช้สิทธิ์เลือกและใช้คูปองได้ถึง {formatDate(expiryInstant(expiry)!)}</p>
    {mode === "CHOICE" && <ul>{rarities.filter(r => quotas[r]).map(r => <li key={r}>{r} เลือกได้ {quotas[r]} ใบ</li>)}</ul>}
    {mode === "FIXED" ? <ul className="pack-review-list">{selected.map(t => <li key={t.id}><span>{t.name}</span><strong>จำนวน {limits[t.id]} ใบ</strong></li>)}</ul> : <p>แฟนเลือกหรือสุ่มจากคูปองทั้งหมดในแต่ละระดับได้เอง รวมถึงเลือกแบบเดิมซ้ำได้จนกว่าจะครบสิทธิ์</p>}
    <p className="text-sm text-muted">{mode === "FIXED" ? "ทุกใบใช้เงื่อนไขที่คุณอ่านและเลือกไว้" : "คูปองใช้เงื่อนไข ณ วันที่ส่งซอง"} งบของแต่ละใบแยกกัน ระดับความพิเศษไม่ได้เป็นเพดานงบรวมของซอง</p>
    {error && <ErrorText message={error} />}
    <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => void send()}>{busy ? "กำลังปิดผนึกและส่ง…" : "ปิดผนึก ส่งให้แฟน"}</Button><Button variant="secondary" disabled={busy} onClick={() => { setReview(false); setError(null); }}>กลับไปจัดซอง</Button></div>
  </Card>;

  const visible = templates.filter(t => (filter === "ALL" || t.rarity === filter) && (!selectedOnly || limits[t.id] > 0) && `${t.name} ${t.description}`.includes(search.trim()));
  return <div className="space-y-6">
    <Card variant="letter" className="space-y-4">
      <h2>อยากจัดของขวัญเป็นชุดแบบไหน?</h2>
      <div className="pack-mode-grid">{([
        ["FIXED", "เลือกคูปองใส่ชุด", "เลือกคูปองพร้อมจำนวน แฟนได้รับตามที่เราจัดไว้"],
        ["CHOICE", "เลือกซองตาม tier", "จัดซองสีตามระดับ แฟนเปิดเลือกหรือสุ่มครั้งละกี่ใบก็ได้"],
      ] as const).map(([value, label, hint]) => <div key={value}><Button variant={mode === value ? "primary" : "secondary"} aria-pressed={mode === value} className="w-full" onClick={() => setMode(value)}>{label}</Button><p className="mt-2 text-sm text-muted">{hint}</p></div>)}</div>
      {birthday && <Button variant="ghost" onClick={() => {
        setMode("FIXED"); setName(birthday.name); setLimits(Object.fromEntries(birthday.items.map(i => [i.couponTemplateId, i.quantity])));
        setMessage("ดีใจที่โลกนี้มีเธอ ปีนี้ขอให้มีเราอยู่ข้าง ๆ ในทุกวันนะ");
        const next = new Date(); next.setFullYear(next.getFullYear() + 1); setExpiry(localDate(next));
      }}><StationeryIcon name="gift" className="h-5 w-5 shrink-0" />เริ่มจากชุดวันเกิด 22 ใบ</Button>}
      <div className="grid gap-4 sm:grid-cols-2"><Field label="ชื่อชุดของขวัญ"><Input maxLength={100} value={name} onChange={e => setName(e.target.value)} /></Field><Field label="เลือกและใช้คูปองได้ถึง"><Input type="date" min={localDate()} value={expiry} onChange={e => setExpiry(e.target.value)} /></Field></div>
      <Field label="ข้อความในการ์ดถึงเธอ"><Textarea maxLength={500} value={message} onChange={e => setMessage(e.target.value)} placeholder="การ์ดใบนี้ส่งไปพร้อมชุดของขวัญ เขียนอะไรให้เธออ่านหน่อยนะ…" /></Field>
    </Card>
    {mode === "CHOICE" && <section className="space-y-4" aria-label="ซองของขวัญตามระดับ"><h2>จัดซองตาม tier ใส่ชุดของขวัญ</h2><p className="text-sm text-muted">เช่น EPIC 10 ใบ ผู้รับแบ่งเลือกหรือสุ่มครั้งละ 1 ใบ หรือหลายใบก็ได้ ซองเหล่านี้แยกจากการ์ดข้อความที่ส่งไปด้วยกัน</p><div className="tier-envelope-grid">{rarities.map(r => <TierEnvelope key={r} rarity={r} quantity={quotas[r] ?? 0}><Field label={r}><Input type="number" min={0} max={100} step={1} value={quotas[r] ?? 0} onChange={e => setQuotas(previous => ({ ...previous, [r]: Math.max(0, Math.min(100, Math.trunc(Number(e.target.value) || 0))) }))} /></Field></TierEnvelope>)}</div></section>}
    {mode === "FIXED" && <section className="space-y-4" aria-label="เลือกคูปองใส่ซอง">
      <div><h2>เลือกคำสัญญาใส่ซอง</h2><p className="text-sm text-muted">กางตั๋วอ่านเงื่อนไข แล้วกำหนดจำนวนใบ · เลือกไว้แล้ว {selected.length} แบบ</p></div>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="หาคูปอง"><Input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="งานบ้าน กอด ไปหา…" /></Field><Field label="ระดับความพิเศษ"><Select value={filter} onChange={e => setFilter(e.target.value as Rarity | "ALL")}><option value="ALL">ทุกระดับ</option>{rarities.map(r => <option key={r} value={r}>{rarityStyles[r].label}</option>)}</Select></Field></div>
      <Button variant="secondary" aria-pressed={selectedOnly} onClick={() => setSelectedOnly(!selectedOnly)}>{selectedOnly ? "ดูคลังคูปองทั้งหมด" : `ดูเฉพาะที่เลือก (${selected.length})`}</Button>
      {!visible.length && <p role="status">ยังไม่มีคูปองตรงกับที่ค้นหา ลองเปลี่ยนคำค้นหรือระดับดูนะ</p>}
      <div className="pack-ticket-grid">{visible.map(t => <div key={t.id} className="pack-pool-item" data-selected={!!limits[t.id] || undefined}>
        {limits[t.id] > 0 && <p className="pack-selection-label"><StationeryIcon name="check" />อยู่ในซอง · จำนวน {limits[t.id]} ใบ</p>}
        <LoveTicket ticket={{ id: `POOL-${t.id}`, name: t.name, note: t.description, terms: t.terms, rarity: t.rarity, category: t.category, state: "available" }} catalog open={opened === t.id} onOpen={() => setOpened(t.id)} onClose={() => setOpened(null)}>
          <Field label="จำนวนใบที่จะให้"><Input type="number" min={0} max={100} step={1} value={limits[t.id] ?? 0} onChange={e => changeLimit(t, Number(e.target.value))} /></Field>
          <Button variant="secondary" onClick={() => changeLimit(t, (limits[t.id] ?? 0) + 1)}>{limits[t.id] ? "เพิ่มอีก 1 ใบ" : "ใส่ตัวเลือกนี้ในซอง"}</Button>
          {!!limits[t.id] && <Button variant="ghost" onClick={() => changeLimit(t, 0)}>เอาออกจากซอง</Button>}
        </LoveTicket>
      </div>)}</div>
    </section>}
    <Card className="pack-composer-summary space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><p><strong>{total} ใบ</strong> · {mode === "FIXED" ? `${selected.length} แบบ` : "ให้แฟนเลือกหรือสุ่มเอง"} · ถึง {couple.partnerDisplayName}</p><Button onClick={() => { const problem = validate(); setError(problem); if (!problem) { setReview(true); window.scrollTo({ top: 0, behavior: "instant" }); } }}>ตรวจซองก่อนส่ง</Button></div>{error && <ErrorText message={error} />}<p className="text-sm text-muted">{mode === "FIXED" ? "อ่านเงื่อนไขและงบทุกใบก่อนส่ง" : "แฟนเลือกหรือสุ่มคูปองทั้งหมดในระดับที่ให้ได้ตามจำนวนสิทธิ์"} คุณเป็นคนทำตามคำสัญญาในซองนี้นะ</p></Card>
  </div>;
}
