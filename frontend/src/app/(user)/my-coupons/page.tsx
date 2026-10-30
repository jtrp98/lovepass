"use client";

import {
  Button,
  LinkButton,
  Skeleton,
  ErrorState,
  Notice,
  EmptyState,
  RarityBadge,
} from "@/components/ui";
import { couponGroupKey } from "@/lib/flow";
import { LoveTicket, type LoveTicketData } from "@/components/love-ticket";
import { TicketRequest } from "@/components/ticket-request";
import { ApiError, api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import type { MyCoupon, Rarity } from "@/types";

const rarities: (Rarity | "ALL")[] = ["ALL", "COMMON", "RARE", "EPIC", "LEGENDARY"];

/** รวมคูปองชนิดเดียวกัน + วันหมดอายุเดียวกันเป็นการ์ดเดียว (แสดง ×N) — คนละวันหมดอายุแยกการ์ด */
interface GroupedCoupon {
  key: string;
  name: string;
  description: string;
  terms: string;
  rarity: Rarity;
  category: MyCoupon["category"];
  emoji: string | null;
  totalAvailable: number;
  totalReserved: number;
  coupons: MyCoupon[];
  expiresAt: string;
  expiringSoon: boolean;
}

function groupCoupons(coupons: MyCoupon[]): GroupedCoupon[] {
  const groups = new Map<string, MyCoupon[]>();
  for (const coupon of coupons) {
    const key = couponGroupKey(coupon);
    groups.set(key, [...(groups.get(key) ?? []), coupon]);
  }

  return [...groups.entries()]
    .map(([key, items]) => ({
      key,
      name: items[0].name,
      description: items[0].description,
      terms: items[0].terms,
      rarity: items[0].rarity,
      category: items[0].category,
      emoji: items[0].emoji,
      totalReserved: items.reduce((sum, c) => sum + Math.max(0, c.remaining - c.available), 0),
      totalAvailable: items.reduce((sum, c) => sum + c.available, 0),
      coupons: items,
      expiresAt: items[0].expiresAt,
      expiringSoon: items.some((c) => c.expiringSoon),
    }))
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
}

function toTicket(group: GroupedCoupon): LoveTicketData {
  return {
    id: `LP-${String(group.coupons[0].id).padStart(4, "0")}`,
    name: group.name,
    note: group.description,
    terms: group.terms,
    rarity: group.rarity,
    category: group.category,
    state: new Date(group.expiresAt).getTime() <= Date.now() ? "expired" : group.totalAvailable > 0 ? "available" : "pending",
    quantity: group.totalAvailable,
    reserved: group.totalReserved,
    expiresAt: group.expiresAt,
  };
}

export default function MyCouponsPage() {
  const [coupons, setCoupons] = useState<MyCoupon[] | null>(null);
  const [task, setTask] = useState("all");
  const [filter, setFilter] = useState<Rarity | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ group: GroupedCoupon } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sequence = useRef(0);
  const submitLock = useRef(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  async function load(rarity?: string) {
    const current = ++sequence.current;
    setCoupons(null);
    setError(null);
    try {
      const data = await api.coupons.my(rarity);
      if (current === sequence.current) setCoupons(data);
    } catch (err) {
      if (current === sequence.current)
        setError(err instanceof ApiError ? err.displayMessage : "โหลดคูปองไม่สำเร็จ");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function applyFilter(rarity: Rarity | "ALL") {
    setFilter(rarity);
    setCoupons(null);
    await load(rarity === "ALL" ? undefined : rarity);
  }

  async function submitRequest(message: string): Promise<boolean> {
    const coupon = selected?.group.coupons.find((item) => item.available > 0);
    if (!selected || !coupon || submitLock.current) return false;
    submitLock.current = true;
    setRequestError(null);
    setNotice(null);
    setBusy(true);
    try {
      await api.redemptions.request(coupon.id, message || undefined);
      setNotice(`ส่งคำขอใช้ "${coupon.name}" เรียบร้อย รอแฟนยืนยันนะ`);
      return true;
    } catch (err) {
      setRequestError(err instanceof ApiError ? err.displayMessage : "ส่งคำขอไม่สำเร็จ");
      return false;
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }

  /** After the torn stub has fallen away: fold the ticket and show the reserved sheet. */
  function finishRequest() {
    setSelected(null);
    void load(filter === "ALL" ? undefined : filter);
  }

  const groups = coupons
    ? groupCoupons(coupons).filter((group) =>
        task === "available" ? group.totalAvailable > 0 : task === "pending" ? group.totalReserved > 0 : true,
      )
    : null;

  return (
    <div className="pocket-book space-y-6">
      <header className="pocket-intro">
        <div>
          <p className="pocket-mono"><span className="pocket-foil" aria-hidden="true" />OUR LITTLE COUPON BOOK</p>
          <h1 tabIndex={-1}>คูปองของฉัน</h1>
          <p>คำสัญญาใบเล็ก ๆ เก็บไว้ใช้ด้วยกันนะ</p>
        </div>
        <div className="pocket-seal" aria-hidden="true"><small>JUST FOR</small><span>you & me</span><small>WITH LOVE</small></div>
      </header>

      <div className="status-tabs flex flex-wrap gap-2" role="group" aria-label="สถานะคูปอง">
        {[
          { id: "all", label: "ทั้งหมด" },
          { id: "available", label: "ใช้ได้" },
          { id: "pending", label: "รอแฟนยืนยัน" },
        ].map((item) => (
          <button
            key={item.id}
            aria-pressed={task === item.id}
            className="status-tab"
            onClick={() => setTask(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="ประเภทคูปอง">
        {rarities.map((rarity) => (
          <button
            key={rarity}
            aria-pressed={filter === rarity}
            onClick={() => applyFilter(rarity)}
            className="rarity-filter"
          >
            {rarity === "ALL" ? "ทุกประเภท" : <RarityBadge rarity={rarity} />}
          </button>
        ))}
      </div>

      {notice && <Notice>{notice}</Notice>}

      {error ? (
        <ErrorState message={error} retry={() => load(filter === "ALL" ? undefined : filter)} />
      ) : !groups ? (
        <Skeleton />
      ) : groups.length === 0 ? (
        <EmptyState
          action={<LinkButton href="/catalog">เลือกของขวัญให้แฟน</LinkButton>}
          title="ยังไม่มีคูปองที่ใช้ได้"
          hint="ลองเปลี่ยนสถานะหรือประเภทคูปอง หรือเลือกของขวัญให้แฟนก่อนได้"
        />
      ) : (
        <div key={`${task}-${filter}`} className="pocket-collection">
          {groups.map((group) => {
            const ticket = toTicket(group);
            return (
              <LoveTicket key={group.key} ticket={ticket} open={selected?.group.key === group.key} onClose={() => !busy && setSelected(null)} onOpen={() => {
                setRequestError(null);
                setSelected({ group });
              }}>
                {ticket.state === "available" ? <TicketRequest name={group.name} busy={busy} error={requestError} onTear={submitRequest} onDone={finishRequest} /> : <>
                  <p className="pocket-terms">{ticket.state === "expired" ? "ใบนี้หมดอายุแล้ว เก็บคำสัญญาดี ๆ ไว้ได้นะ" : "คูปองนี้อยู่ระหว่างรอแฟนยืนยัน ยังขอใช้เพิ่มไม่ได้"}</p>
                  <Button disabled>{ticket.state === "expired" ? "หมดอายุแล้ว" : "รอแฟนยืนยัน"}</Button>
                </>}
              </LoveTicket>
            );
          })}
        </div>
      )}

      <footer className="pocket-book-footer"><span>แต่ละใบ คือเวลาที่อยากให้กัน</span><LinkButton href="/catalog" variant="ghost">เลือกตั๋วให้แฟนบ้าง <span aria-hidden="true">↗</span></LinkButton></footer>

    </div>
  );
}
