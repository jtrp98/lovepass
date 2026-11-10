"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { defaultExpiry, expiryInstant, localDate } from "@/lib/flow";
import { Button, Card, ErrorState, ErrorText, Field, Input, LinkButton, Notice, RarityBadge, Select, Skeleton, Textarea, rarityStyles, formatDate } from "./ui";
import { LoveTicket } from "./love-ticket";
import { Envelope, StationeryIcon } from "./stationery";
import { TierEnvelope } from "./tier-envelope";
import type { CouponTemplate, GiftPack, Rarity } from "@/types";
import { couponCategories, resolveCategory, type CouponCategory } from "@/lib/coupon-categories";

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
  const [quotas, setQuotas] = useState<Partial<Record<Rarity, number>>>({ COMMON: 1 });
  const [candidatePools, setCandidatePools] = useState<Partial<Record<Rarity, number[]>>>({});
  const [categoryFilter, setCategoryFilter] = useState<CouponCategory | "ALL">("ALL");
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

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lovepass.packComposerDraft");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.mode) setMode(d.mode);
        if (typeof d.name === "string") setName(d.name);
        if (typeof d.message === "string") setMessage(d.message);
        if (d.expiry) setExpiry(d.expiry);
        if (d.limits) setLimits(d.limits);
        if (d.quotas) setQuotas(d.quotas);
        if (d.candidatePools) setCandidatePools(d.candidatePools);
        if (d.categoryFilter) setCategoryFilter(d.categoryFilter);
        if (d.filter) setFilter(d.filter);
        if (typeof d.search === "string") setSearch(d.search);
        if (typeof d.selectedOnly === "boolean") setSelectedOnly(d.selectedOnly);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (result) {
      try {
        sessionStorage.removeItem("lovepass.packComposerDraft");
      } catch {}
      return;
    }
    try {
      sessionStorage.setItem(
        "lovepass.packComposerDraft",
        JSON.stringify({
          mode,
          name,
          message,
          expiry,
          limits,
          quotas,
          candidatePools,
          categoryFilter,
          filter,
          search,
          selectedOnly,
        })
      );
    } catch {}
  }, [mode, name, message, expiry, limits, quotas, candidatePools, categoryFilter, filter, search, selectedOnly, result]);

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

  function toggleCandidate(rarity: Rarity, templateId: number) {
    setCandidatePools(prev => {
      const current = prev[rarity] ?? [];
      const next = current.includes(templateId)
        ? current.filter(id => id !== templateId)
        : [...current, templateId];
      return { ...prev, [rarity]: next };
    });
  }

  function setCandidateMode(rarity: Rarity, custom: boolean) {
    setCandidatePools(prev => {
      if (!custom) {
        const next = { ...prev };
        delete next[rarity];
        return next;
      }
      return { ...prev, [rarity]: prev[rarity] ?? [] };
    });
  }

  function validate() {
    if (!name.trim()) return "ตั้งชื่อซองให้เธอหน่อยนะ";
    if (!expiryInstant(expiry)) return "เลือกวันหมดอายุตั้งแต่วันนี้เป็นต้นไปนะ";
    if (total < 1 || total > 100) return "กำหนดจำนวนรวม 1–100 ใบก่อนนะ";
    if (mode === "FIXED" && !selected.length) return "เลือกคูปองที่จะมอบให้แฟนก่อนนะ";
    if (mode === "CHOICE") {
      for (const rarity of rarities) {
        const q = quotas[rarity] ?? 0;
        if (q > 0) {
          if (!templates.some(t => t.rarity === rarity)) return `ระดับ ${rarity} ยังไม่มีคูปองให้รับ เลือกระดับอื่นก่อนนะ`;
          const pool = candidatePools[rarity];
          if (pool !== undefined && pool.length < q) {
            return `ระดับ ${rarityStyles[rarity].label.split(" · ")[0]} ให้สิทธิ์ ${q} ใบ กรุณาเลือกการ์ดอย่างน้อย ${q} แบบ (ตอนนี้เลือก ${pool.length} แบบ)`;
          }
        }
      }
    }
    return null;
  }

  async function send() {
    if (lock.current) return;
    const invalid = validate();
    if (invalid) { setError(invalid); return; }

    const choiceOptions = mode === "CHOICE"
      ? Object.entries(candidatePools).flatMap(([rarity, ids]) => {
          const q = quotas[rarity as Rarity] ?? 0;
          if (!q || !ids || !ids.length) return [];
          return ids.map(id => ({ couponTemplateId: id, limit: 1 }));
        })
      : [];

    const payload = {
      receiverId: couple!.partnerUserId,
      name: name.trim(),
      mode,
      message: message || undefined,
      expiresAt: expiryInstant(expiry)!,
      options: mode === "FIXED" ? selected.map(t => ({ couponTemplateId: t.id, limit: limits[t.id] })) : choiceOptions,
      quotas: mode === "FIXED" ? [] : rarities.filter(r => quotas[r]).map(r => ({ rarity: r, quantity: quotas[r]! }))
    };

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
    <LinkButton href="/gifts?tab=sent">ดูของขวัญของเรา</LinkButton>
  </Card>;

  if (review) return <Card variant="letter" className="space-y-5">
    <p className="pocket-mono">ตรวจการ์ด และของขวัญในชุด</p><h2>{name}</h2>
    <p>ถึง {couple.partnerDisplayName} · {mode === "FIXED" ? "ชุดคูปองที่เราเลือกให้" : "ชุดซองคูปองตามระดับ"} · รวม {total} ใบ</p>
    {message && <p className="font-display whitespace-pre-wrap">“{message}”</p>}
    <p>ใช้สิทธิ์เลือกและใช้คูปองได้ถึง {formatDate(expiryInstant(expiry)!)}</p>
    {mode === "CHOICE" && <ul className="space-y-1.5">{rarities.filter(r => quotas[r]).map(r => {
      const pool = candidatePools[r];
      const hasCustom = pool !== undefined && pool.length > 0;
      return <li key={r}>
        <strong>{rarityStyles[r].label.split(" · ")[0]}:</strong> เลือกได้ {quotas[r]} ใบ —{" "}
        {hasCustom ? (
          <span className="font-medium text-love">
            จากเฉพาะ {pool.length} แบบที่คุณเลือกไว้ ({templates.filter(t => pool.includes(t.id)).map(t => t.name).join(", ")})
          </span>
        ) : (
          <span className="text-muted">จากคูปองทั้งหมดในระดับนี้</span>
        )}
      </li>;
    })}</ul>}
    {mode === "FIXED" ? <ul className="pack-review-list">{selected.map(t => <li key={t.id}><span>{t.name}</span><strong>จำนวน {limits[t.id]} ใบ</strong></li>)}</ul> : null}
    <p className="text-sm text-muted">{mode === "FIXED" ? "ทุกใบใช้เงื่อนไขที่คุณอ่านและเลือกไว้" : "คูปองใช้เงื่อนไข ณ วันที่ส่งซอง"} งบของแต่ละใบแยกกัน ระดับความพิเศษไม่ได้เป็นเพดานงบรวมของซอง</p>
    {error && <ErrorText message={error} />}
    <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => void send()}>{busy ? "กำลังปิดผนึกและส่ง…" : "ปิดผนึก ส่งให้แฟน"}</Button><Button variant="secondary" disabled={busy} onClick={() => { setReview(false); setError(null); }}>กลับไปจัดซอง</Button></div>
  </Card>;

  const visible = templates.filter(t => (filter === "ALL" || t.rarity === filter) && (categoryFilter === "ALL" || resolveCategory(t.category) === categoryFilter) && (!selectedOnly || limits[t.id] > 0) && `${t.name} ${t.description}`.includes(search.trim()));
  const activeTiers = rarities.filter(r => (quotas[r] ?? 0) > 0);

  return <div className="space-y-6">
    <Card variant="letter" className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">อยากจัดของขวัญแบบไหน?</h2>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="วิธีจัดชุดของขวัญ">
        <button
          type="button"
          role="radio"
          aria-checked={mode === "FIXED"}
          onClick={() => setMode("FIXED")}
          className="selection-card"
        >
          <div className="space-y-1 text-left min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <StationeryIcon name="hearts" className="h-5 w-5 text-love shrink-0" />
              <span className="font-semibold text-ink text-base">เลือกคูปองเอง</span>
              <span className="text-xs text-muted">· เลือกคูปองใส่ชุด</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              เลือกคูปองทีละใบตามใจคุณ แฟนได้รับตามที่เราจัดไว้
            </p>
          </div>
          <div className="selection-card-indicator" aria-hidden="true">
            {mode === "FIXED" && <span className="h-2 w-2 rounded-full bg-white" />}
          </div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === "CHOICE"}
          onClick={() => setMode("CHOICE")}
          className="selection-card"
        >
          <div className="space-y-1 text-left min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <StationeryIcon name="gift" className="h-5 w-5 text-love shrink-0" />
              <span className="font-semibold text-ink text-base">เลือกตามระดับความพิเศษ</span>
              <span className="text-xs text-muted">· เลือกซองตาม tier</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              ให้ระบบช่วยจัดตามระดับที่เลือก แฟนเปิดเลือกหรือสุ่มได้
            </p>
          </div>
          <div className="selection-card-indicator" aria-hidden="true">
            {mode === "CHOICE" && <span className="h-2 w-2 rounded-full bg-white" />}
          </div>
        </button>
      </div>
      {birthday && <Button variant="ghost" onClick={() => {
        setMode("FIXED"); setName(birthday.name); setLimits(Object.fromEntries(birthday.items.map(i => [i.couponTemplateId, i.quantity])));
        setMessage("ดีใจที่โลกนี้มีเธอ ปีนี้ขอให้มีเราอยู่ข้าง ๆ ในทุกวันนะ");
        const next = new Date(); next.setFullYear(next.getFullYear() + 1); setExpiry(localDate(next));
      }}><StationeryIcon name="gift" className="h-5 w-5 shrink-0" />เริ่มจากชุดวันเกิด 22 ใบ</Button>}
      <div className="grid gap-4 sm:grid-cols-2"><Field label="ชื่อชุดของขวัญ"><Input maxLength={100} value={name} onChange={e => setName(e.target.value)} /></Field><Field label="วันสุดท้ายที่เลือกและใช้คูปองได้ (วันหมดอายุ)" hint="คูปองทุกใบในซองนี้จะหมดอายุในวันเดียวกันทั้งหมด แม้จะเปิดซองวันไหนก็ตาม (ไม่เริ่มนับใหม่หลังเปิด)"><Input type="date" min={localDate()} value={expiry} onChange={e => setExpiry(e.target.value)} /></Field></div>
      <Field label="ข้อความในการ์ดถึงเธอ"><Textarea maxLength={500} value={message} onChange={e => setMessage(e.target.value)} placeholder="การ์ดใบนี้ส่งไปพร้อมชุดของขวัญ เขียนอะไรให้เธออ่านหน่อยนะ…" /></Field>
    </Card>

    {mode === "CHOICE" && (
      <section className="space-y-6" aria-label="ซองของขวัญตามระดับ">
        <div>
          <h2>จัดซองตาม tier ใส่ชุดของขวัญ</h2>
          <p className="text-sm text-muted">กำหนดจำนวนใบในแต่ละระดับ หากต้องการเลือกการ์ดตัวเลือก (Candidate) ให้แฟนเลือกเอง สามารถกดเลือกในแต่ละระดับได้</p>
        </div>
        <div className="tier-envelope-grid">
          {rarities.map(r => (
            <TierEnvelope key={r} rarity={r} quantity={quotas[r] ?? 0}>
              <Field label={r}>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={quotas[r] ?? 0}
                  onChange={e => setQuotas(previous => ({ ...previous, [r]: Math.max(0, Math.min(100, Math.trunc(Number(e.target.value) || 0))) }))}
                />
              </Field>
            </TierEnvelope>
          ))}
        </div>

        {activeTiers.length > 0 && (
          <div className="space-y-4 pt-2">
            <div>
              <h3>ตัวเลือกคูปองในแต่ละระดับ (Candidate Cards)</h3>
              <p className="text-sm text-muted">ค่าเริ่มต้นคือแฟนเลือกจากคูปองทั้งหมดในระดับนั้น หากอยากให้แฟนเลือกเฉพาะการ์ดที่คุณกำหนด (เช่น 5 ใบให้เลือก 1 ใบ) สามารถเลือกการ์ดด้านล่างได้</p>
            </div>

            {activeTiers.map(r => {
              const tierQuota = quotas[r] ?? 0;
              const tierTemplates = templates.filter(t => t.rarity === r);
              const isCustom = candidatePools[r] !== undefined;
              const pool = candidatePools[r] ?? [];

              return (
                <Card key={r} variant="booklet" className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                    <div className="flex items-center gap-2">
                      <RarityBadge rarity={r} />
                      <span className="font-semibold">{rarityStyles[r].label.split(" · ")[0]}</span>
                      <span className="text-sm text-muted">(ให้แฟนเลือก {tierQuota} ใบ)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={!isCustom ? "primary" : "secondary"}
                        aria-pressed={!isCustom}
                        onClick={() => setCandidateMode(r, false)}
                      >
                        คูปองทั้งหมด ({tierTemplates.length} แบบ)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={isCustom ? "primary" : "secondary"}
                        aria-pressed={isCustom}
                        onClick={() => setCandidateMode(r, true)}
                      >
                        เลือกการ์ดให้แฟนเลือกเอง ({pool.length} แบบ)
                      </Button>
                    </div>
                  </div>

                  {isCustom ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted">
                        เลือกการ์ดที่ต้องการให้เป็นตัวเลือก (ต้องเลือกอย่างน้อย {tierQuota} แบบ) · ตอนนี้เลือกไว้ {pool.length} แบบ
                        {pool.length < tierQuota && (
                          <span className="ml-1 text-love font-medium">
                            — กรุณาเลือกเพิ่มอีก {tierQuota - pool.length} แบบ
                          </span>
                        )}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {tierTemplates.map(t => {
                          const picked = pool.includes(t.id);
                          return (
                            <div
                              key={t.id}
                              className="flex flex-col justify-between rounded-xl border p-3 transition-colors"
                              style={{
                                borderColor: picked ? "var(--color-love)" : "var(--color-line)",
                                backgroundColor: picked ? "var(--color-love-soft)" : "var(--color-surface)",
                              }}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-sm">{t.name}</span>
                                  {picked && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-love">
                                      <StationeryIcon name="check" className="h-4 w-4" />
                                      เลือกแล้ว
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted line-clamp-2">{t.description}</p>
                              </div>
                              <div className="pt-2 text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={picked ? "primary" : "secondary"}
                                  onClick={() => toggleCandidate(r, t.id)}
                                >
                                  {picked ? "นำออกจากตัวเลือก" : "ใส่เป็นตัวเลือก"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">
                      แฟนสามารถเปิดเลือกหรือสุ่มจากคูปองทั้งหมดในระดับนี้ ({tierTemplates.length} แบบ) ได้ตามจำนวน {tierQuota} ใบ
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    )}

    {mode === "FIXED" && <section className="space-y-4" aria-label="เลือกคูปองใส่ซอง">
      <div><h2>เลือกคำสัญญาใส่ซอง</h2><p className="text-sm text-muted">กางตั๋วอ่านเงื่อนไข แล้วกำหนดจำนวนใบ · เลือกไว้แล้ว {selected.length} แบบ</p></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="หาคูปอง"><Input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="งานบ้าน กอด ไปหา…" /></Field>
        <Field label="หมวดหมู่">
          <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as CouponCategory | "ALL")}>
            <option value="ALL">ทุกหมวดหมู่</option>
            {Object.entries(couponCategories).map(([key, category]) => <option key={key} value={key}>{category.label}</option>)}
          </Select>
        </Field>
        <Field label="ระดับความพิเศษ">
          <Select value={filter} onChange={e => setFilter(e.target.value as Rarity | "ALL")}>
            <option value="ALL">ทุกระดับ</option>
            {rarities.map(r => <option key={r} value={r}>{rarityStyles[r].label}</option>)}
          </Select>
        </Field>
      </div>
      <Button variant="secondary" aria-pressed={selectedOnly} onClick={() => setSelectedOnly(!selectedOnly)}>{selectedOnly ? "ดูคลังคูปองทั้งหมด" : `ดูเฉพาะที่เลือก (${selected.length})`}</Button>
      {!visible.length && <p role="status">ยังไม่มีคูปองตรงกับที่ค้นหา ลองเปลี่ยนคำค้น หมวดหมู่ หรือระดับดูนะ</p>}
      <div className="pack-ticket-grid">{visible.map(t => <div key={t.id} className="pack-pool-item" data-selected={!!limits[t.id] || undefined}>
        {limits[t.id] > 0 && <p className="pack-selection-label"><StationeryIcon name="check" />อยู่ในซอง · จำนวน {limits[t.id]} ใบ</p>}
        <LoveTicket ticket={{ id: `POOL-${t.id}`, name: t.name, note: t.description, terms: t.terms, rarity: t.rarity, category: t.category, state: "available" }} catalog open={opened === t.id} onOpen={() => setOpened(t.id)} onClose={() => setOpened(null)}>
          <Field label="จำนวนใบที่จะให้"><Input type="number" min={0} max={100} step={1} value={limits[t.id] ?? 0} onChange={e => changeLimit(t, Number(e.target.value))} /></Field>
          <Button variant="secondary" onClick={() => changeLimit(t, (limits[t.id] ?? 0) + 1)}>{limits[t.id] ? "เพิ่มอีก 1 ใบ" : "ใส่ตัวเลือกนี้ในซอง"}</Button>
          {!!limits[t.id] && <Button variant="ghost" onClick={() => changeLimit(t, 0)}>เอาออกจากซอง</Button>}
        </LoveTicket>
      </div>)}</div>
    </section>}

    <Card className="pack-composer-summary space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><p><strong>{total} ใบ</strong> · {mode === "FIXED" ? `${selected.length} แบบ` : "ให้แฟนเลือกหรือสุ่มเอง"} · ถึง {couple.partnerDisplayName}</p><Button onClick={() => { const problem = validate(); setError(problem); if (!problem) { setReview(true); window.scrollTo({ top: 0, behavior: "instant" }); } }}>ตรวจซองก่อนส่ง</Button></div>{error && <ErrorText message={error} />}<p className="text-sm text-muted">{mode === "FIXED" ? "อ่านเงื่อนไขและงบทุกใบก่อนส่ง" : "แฟนเลือกหรือสุ่มคูปองในระดับที่ให้ได้ตามจำนวนสิทธิ์"} คุณเป็นคนทำตามคำสัญญาในซองนี้นะ</p></Card>
  </div>;
}
