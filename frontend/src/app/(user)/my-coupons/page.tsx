"use client";

import { Button, Card, EmptyState, ErrorText, Field, PageTitle, RarityBadge, Textarea, daysLeft, formatDate, rarityStyles } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useEffect, useState } from "react";
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
  coupons: MyCoupon[];
  expiresAt: string;
  expiringSoon: boolean;
}

function groupCoupons(coupons: MyCoupon[]): GroupedCoupon[] {
  const groups = new Map<string, MyCoupon[]>();
  for (const coupon of coupons) {
    const key = `${coupon.name}|${coupon.expiresAt}`;
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
      totalAvailable: items.reduce((sum, c) => sum + c.available, 0),
      coupons: items,
      expiresAt: items[0].expiresAt,
      expiringSoon: items.some((c) => c.expiringSoon),
    }))
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
}

export default function MyCouponsPage() {
  const [coupons, setCoupons] = useState<MyCoupon[] | null>(null);
  const [filter, setFilter] = useState<Rarity | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<{ coupon: MyCoupon; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(rarity?: string) {
    try {
      setCoupons(await api.coupons.my(rarity));
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "โหลดคูปองไม่สำเร็จ");
      setCoupons([]);
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
    if (!requesting) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await api.redemptions.request(requesting.coupon.id, requesting.message || undefined);
      setNotice(`ส่งคำขอใช้ "${requesting.coupon.name}" เรียบร้อย — รอแฟนยืนยัน 💌`);
      setRequesting(null);
      await load(filter === "ALL" ? undefined : filter);
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ส่งคำขอไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const groups = coupons ? groupCoupons(coupons) : null;

  return (
    <div className="space-y-6">
      <PageTitle title="คูปองของฉัน 🎟️" subtitle="คูปองที่ได้รับจากแฟน เรียงจากหมดอายุเร็วที่สุดก่อน" />

      <div className="flex flex-wrap gap-2">
        {rarities.map((rarity) => (
          <button
            key={rarity}
            onClick={() => applyFilter(rarity)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              filter === rarity
                ? "border-rose-400 bg-rose-100 font-semibold text-rose-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {rarity === "ALL" ? "ทั้งหมด" : rarity}
          </button>
        ))}
      </div>

      {notice ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p> : null}
      <ErrorText message={error} />

      {!groups ? (
        <p className="text-gray-400">กำลังโหลด...</p>
      ) : groups.length === 0 ? (
        <EmptyState title="ยังไม่มีคูปองที่ใช้ได้" hint="รอแฟนมอบคูปองมา หรือไปมอบให้แฟนก่อนก็ได้ 😉" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => {
            const usable = group.coupons.find((c) => c.available > 0) ?? group.coupons[0];
            return (
              <Card key={group.key} className={`flex flex-col gap-2 border-2 ${rarityStyles[group.rarity].border}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-3xl">{group.emoji ?? "🎟️"}</p>
                  <div className="flex flex-col items-end gap-1">
                    <RarityBadge rarity={group.rarity} />
                    {group.coupons.length > 1 ? (
                      <span className="text-xs text-gray-400">รวม {group.coupons.length} ชุด</span>
                    ) : null}
                  </div>
                </div>

                <p className="font-bold">
                  {group.name}{" "}
                  {group.totalAvailable > 1 ? <span className="text-rose-600">×{group.totalAvailable}</span> : null}
                </p>
                <p className="text-sm text-gray-600">{group.description}</p>
                {group.terms ? <p className="text-xs text-gray-400">เงื่อนไข: {group.terms}</p> : null}

                <div className="mt-1 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
                  <span className={group.expiringSoon ? "font-semibold text-amber-600" : "text-gray-500"}>
                    หมดอายุ {formatDate(group.expiresAt)} (เหลือ {daysLeft(group.expiresAt)} วัน)
                    {group.expiringSoon ? " ⚠️" : ""}
                  </span>
                  <span className="text-gray-500">ใช้ได้ {group.totalAvailable} ใบ</span>
                </div>

                <Button
                  className="mt-auto"
                  disabled={group.totalAvailable === 0}
                  onClick={() => setRequesting({ coupon: usable, message: "" })}
                >
                  {group.totalAvailable === 0 ? "สิทธิ์ถูกกันไว้ทั้งหมด" : "ขอใช้คูปองนี้ 💞"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {requesting ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm space-y-4">
            <p className="text-lg font-bold">ขอใช้ “{requesting.coupon.name}”</p>
            <p className="text-sm text-gray-500">ระบบจะกันสิทธิ์ 1 ใบไว้ระหว่างรอแฟนยืนยัน</p>
            <Field label="ข้อความถึงแฟน (ไม่บังคับ)">
              <Textarea
                value={requesting.message}
                onChange={(e) => setRequesting({ ...requesting, message: e.target.value })}
                maxLength={500}
                placeholder="ขอใช้ตอนเย็นนี้นะ 🥺"
              />
            </Field>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setRequesting(null)}>
                ยกเลิก
              </Button>
              <Button className="flex-1" onClick={submitRequest} disabled={busy}>
                {busy ? "กำลังส่ง..." : "ส่งคำขอ"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
