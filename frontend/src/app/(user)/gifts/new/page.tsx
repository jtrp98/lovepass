"use client";

import { Button, Card, ErrorText, Field, Input, PageTitle, RarityBadge, Textarea, formatDate } from "@/components/ui";
import { ApiError, api, giftCart } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { CoupleInfo, CouponSet, GiftResult } from "@/types";

function defaultExpiry(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().slice(0, 10);
}

function NewGiftForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setFromQuery = searchParams.get("set") ? Number(searchParams.get("set")) : null;

  const [couple, setCouple] = useState<CoupleInfo | null | undefined>(undefined);
  const [sets, setSets] = useState<CouponSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | null>(setFromQuery);
  const [cart, setCart] = useState(giftCart.read());
  const [expiresAt, setExpiresAt] = useState(defaultExpiry());
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GiftResult | null>(null);

  useEffect(() => {
    api.couples.me().then(setCouple).catch(() => setCouple(null));
    api.catalog.sets().then(setSets).catch(() => setSets([]));
  }, []);

  useEffect(() => {
    setSelectedSetId(setFromQuery);
  }, [setFromQuery]);

  function updateQuantity(templateId: number, quantity: number) {
    setCart((prev) => {
      const next = prev
        .map((i) => (i.couponTemplateId === templateId ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0);
      giftCart.write(next);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!couple) {
      setError("ต้องจับคู่ก่อนจึงจะมอบคูปองได้");
      return;
    }

    if (!selectedSetId && cart.length === 0) {
      setError("ยังไม่ได้เลือกคูปอง — เลือกจากคลังคูปองหรือเลือกชุดสำเร็จรูปก่อน");
      return;
    }

    const expiresAtUtc = new Date(`${expiresAt}T23:59:59`).toISOString();
    setSubmitting(true);

    try {
      const gift = selectedSetId
        ? await api.gifts.createFromSet({
            receiverId: couple.partnerUserId,
            expiresAt: expiresAtUtc,
            message: message || undefined,
            couponSetId: selectedSetId,
          })
        : await api.gifts.createCustom({
            receiverId: couple.partnerUserId,
            expiresAt: expiresAtUtc,
            message: message || undefined,
            items: cart.map(({ couponTemplateId, quantity }) => ({ couponTemplateId, quantity })),
          });

      giftCart.clear();
      setCart([]);
      setResult(gift);
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "มอบคูปองไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <Card className="space-y-4 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="text-xl font-bold">มอบคูปองสำเร็จ!</h1>
        <p className="text-gray-600">
          มอบให้ {couple?.partnerDisplayName} รวม {result.totalCoupons} ใบ หมดอายุ {formatDate(result.expiresAt)}
        </p>
        <ul className="mx-auto max-w-sm space-y-1 text-sm">
          {result.items.map((item) => (
            <li key={item.couponTemplateId} className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-1.5">
              <span>
                {item.emoji ?? "🎟️"} {item.name}
              </span>
              <span className="font-semibold">×{item.quantity}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-center gap-2">
          <Link href="/my-coupons">
            <Button variant="secondary">ดูคูปองของฉัน</Button>
          </Link>
          <Button onClick={() => router.push("/dashboard")}>กลับ Dashboard</Button>
        </div>
      </Card>
    );
  }

  if (couple === undefined) return <p className="text-gray-400">กำลังโหลด...</p>;

  if (couple === null) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-4xl">💞</p>
        <p className="font-semibold">ยังไม่ได้จับคู่</p>
        <p className="text-sm text-gray-600">ต้องจับคู่กับแฟนก่อนจึงจะมอบคูปองได้</p>
        <Link href="/couple">
          <Button>ไปจับคู่</Button>
        </Link>
      </Card>
    );
  }

  const selectedSet = sets.find((s) => s.id === selectedSetId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageTitle
        title="มอบคูปองให้แฟน 💝"
        subtitle={`ผู้รับ: ${couple.partnerDisplayName} — เลือกคูปองเอง หรือเลือกชุดสำเร็จรูป`}
      />

      <Card className="space-y-3">
        <Field label="เลือกชุดสำเร็จรูป (ถ้าเลือกชุด จะมอบตามเนื้อหาชุดนั้น)">
          <select
            value={selectedSetId ?? ""}
            onChange={(e) => setSelectedSetId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">— เลือกเองจากตะกร้า —</option>
            {sets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name} (รวม {set.totalCoupons} ใบ)
              </option>
            ))}
          </select>
        </Field>

        {selectedSet ? (
          <div className="rounded-lg bg-rose-50 p-3 text-sm">
            <p className="font-semibold">{selectedSet.name}</p>
            <p className="mt-1 text-gray-600">
              {selectedSet.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              ตะกร้าคูปอง ({cart.reduce((sum, i) => sum + i.quantity, 0)} ใบ) —{" "}
              <Link href="/catalog" className="text-rose-600 hover:underline">
                ไปเลือกเพิ่มที่คลังคูปอง
              </Link>
            </p>
            {cart.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">
                ยังไม่มีคูปองในตะกร้า
              </p>
            ) : (
              cart.map((item) => (
                <div key={item.couponTemplateId} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{item.emoji ?? "🎟️"}</span>
                    {item.name}
                    <RarityBadge rarity={item.rarity} />
                  </span>
                  <span className="flex items-center gap-1">
                    <Button type="button" size="sm" variant="ghost" onClick={() => updateQuantity(item.couponTemplateId, item.quantity - 1)}>
                      −
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => updateQuantity(item.couponTemplateId, item.quantity + 1)}>
                      +
                    </Button>
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="วันหมดอายุ">
          <Input type="date" value={expiresAt} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setExpiresAt(e.target.value)} required />
        </Field>
        <Field label="ข้อความถึงแฟน (ไม่บังคับ)">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="สุขสันต์วันครบรอบนะ 💕" />
        </Field>
      </Card>

      <ErrorText message={error} />

      <Button type="submit" disabled={submitting} className="w-full py-3 text-base">
        {submitting ? "กำลังมอบ..." : "ยืนยันมอบคูปอง 💝"}
      </Button>
    </form>
  );
}

export default function NewGiftPage() {
  return (
    <Suspense>
      <NewGiftForm />
    </Suspense>
  );
}
