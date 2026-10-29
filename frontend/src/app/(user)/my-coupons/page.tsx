"use client";

import {
  Button,
  CouponCard,
  Dialog,
  LinkButton,
  Skeleton,
  ErrorState,
  Notice,
  EmptyState,
  ErrorText,
  Field,
  PageTitle,
  RarityBadge,
  Textarea,
  daysLeft,
  formatDate,
} from "@/components/ui";
import { couponGroupKey } from "@/lib/flow";
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
      emoji: items[0].emoji,
      totalReserved: items.reduce((sum, c) => sum + Math.max(0, c.remaining - c.available), 0),
      totalAvailable: items.reduce((sum, c) => sum + c.available, 0),
      coupons: items,
      expiresAt: items[0].expiresAt,
      expiringSoon: items.some((c) => c.expiringSoon),
    }))
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
}

export default function MyCouponsPage() {
  const [coupons, setCoupons] = useState<MyCoupon[] | null>(null);
  const [task, setTask] = useState("all");
  const [filter, setFilter] = useState<Rarity | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<{ coupon: MyCoupon; message: string } | null>(null);
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

  async function submitRequest() {
    if (!requesting || submitLock.current) return;
    submitLock.current = true;
    setRequestError(null);
    setNotice(null);
    setBusy(true);
    try {
      await api.redemptions.request(requesting.coupon.id, requesting.message || undefined);
      setNotice(`ส่งคำขอใช้ "${requesting.coupon.name}" เรียบร้อย — รอแฟนยืนยัน 💌`);
      setRequesting(null);
      await load(filter === "ALL" ? undefined : filter);
    } catch (err) {
      setRequestError(err instanceof ApiError ? err.displayMessage : "ส่งคำขอไม่สำเร็จ");
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }

  const groups = coupons
    ? groupCoupons(coupons).filter((group) =>
        task === "available" ? group.totalAvailable > 0 : task === "pending" ? group.totalReserved > 0 : true,
      )
    : null;

  return (
    <div className="space-y-6">
      <PageTitle title="คูปองของฉัน 🎟️" subtitle="คูปองที่ได้รับจากแฟน เรียงจากหมดอายุเร็วที่สุดก่อน" />

      <div className="flex flex-wrap gap-2" role="group" aria-label="สถานะคูปอง">
        {[
          { id: "all", label: "ทั้งหมด" },
          { id: "available", label: "ใช้ได้" },
          { id: "pending", label: "รอแฟนยืนยัน" },
        ].map((item) => (
          <Button
            key={item.id}
            aria-pressed={task === item.id}
            variant={task === item.id ? "primary" : "secondary"}
            onClick={() => setTask(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {rarities.map((rarity) => (
          <button
            key={rarity}
            aria-pressed={filter === rarity}
            onClick={() => applyFilter(rarity)}
            className={`min-h-12 rounded-full border px-3 py-2 text-sm transition-colors ${
              filter === rarity
                ? "border-control bg-love-soft font-semibold text-love"
                : "border-control text-muted hover:bg-canvas"
            }`}
          >
            {rarity === "ALL" ? "ทั้งหมด" : <RarityBadge rarity={rarity} />}
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
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => {
            const usable = group.coupons.find((c) => c.available > 0) ?? group.coupons[0];
            return (
              <CouponCard rarity={group.rarity} key={group.key} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-3xl">{group.emoji ?? "🎟️"}</p>
                  <div className="flex flex-col items-end gap-1">
                    <RarityBadge rarity={group.rarity} />
                    {group.coupons.length > 1 ? (
                      <span className="text-sm text-muted">รวม {group.coupons.length} ชุด</span>
                    ) : null}
                  </div>
                </div>

                <p className="font-semibold">
                  {group.name}{" "}
                  {group.totalAvailable > 1 ? (
                    <span className="text-love">×{group.totalAvailable}</span>
                  ) : null}
                </p>
                <p className="text-sm text-muted">{group.description}</p>
                {group.terms ? <p className="text-sm text-muted">เงื่อนไข: {group.terms}</p> : null}

                <div className="mt-1 flex flex-wrap gap-2 items-center justify-between rounded-lg bg-canvas px-3 py-1.5 text-sm">
                  <span className={group.expiringSoon ? "font-semibold text-butter-ink" : "text-muted"}>
                    หมดอายุ {formatDate(group.expiresAt)} (เหลือ {daysLeft(group.expiresAt)} วัน)
                    {group.expiringSoon ? " ⚠️" : ""}
                  </span>
                  <span className="text-muted">
                    ใช้ได้ {group.totalAvailable} ใบ
                    {group.totalReserved > 0 ? ` · รอแฟนยืนยัน ${group.totalReserved} ใบ` : ""}
                  </span>
                </div>

                <Button
                  className="mt-auto"
                  disabled={group.totalAvailable === 0}
                  onClick={() => {
                    setRequestError(null);
                    setRequesting({ coupon: usable, message: "" });
                  }}
                >
                  {group.totalAvailable === 0 ? "รอแฟนยืนยัน" : "ขอใช้คูปองนี้ 💞"}
                </Button>
              </CouponCard>
            );
          })}
        </div>
      )}

      {requesting ? (
        <Dialog title={`ขอใช้ “${requesting.coupon.name}”`} busy={busy} onClose={() => setRequesting(null)}>
          <p className="text-sm text-muted">ระบบจะกันสิทธิ์ 1 ใบไว้ระหว่างรอแฟนยืนยัน</p>
          <Field label="ข้อความถึงแฟน (ไม่บังคับ)">
            <Textarea
              disabled={busy}
              value={requesting.message}
              onChange={(e) => setRequesting({ ...requesting, message: e.target.value })}
              maxLength={500}
              placeholder="ขอใช้ตอนเย็นนี้นะ 🥺"
            />
          </Field>
          <ErrorText message={requestError} />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy}
              variant="secondary"
              className="flex-1"
              onClick={() => setRequesting(null)}
            >
              ยกเลิก
            </Button>
            <Button className="flex-1" onClick={submitRequest} disabled={busy}>
              {busy ? "กำลังส่ง..." : "ส่งคำขอ"}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
