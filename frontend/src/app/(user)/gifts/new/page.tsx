"use client";

import {
  Button,
  Card,
  LinkButton,
  Select,
  Skeleton,
  Notice,
  ErrorState,
  ErrorText,
  Field,
  Input,
  PageTitle,
  RarityBadge,
  Textarea,
  formatDate,
} from "@/components/ui";
import { defaultExpiry, localDate, expiryInstant, quantityBound } from "@/lib/flow";
import { ApiError, api, giftCart } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import type { CoupleInfo, CouponSet, GiftResult } from "@/types";

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

  const [loadError, setLoadError] = useState<string | null>(null);
  const [setsReady, setSetsReady] = useState(false);
  const [setsError, setSetsError] = useState<string | null>(null);
  const lock = useRef(false);
  async function loadCouple() {
    setLoadError(null);
    setCouple(undefined);
    try {
      setCouple(await api.couples.me());
    } catch {
      setLoadError("โหลดผู้รับไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  }
  async function loadSets() {
    setSetsReady(false);
    setSetsError(null);
    try {
      setSets(await api.catalog.sets());
      setSetsReady(true);
    } catch {
      setSetsError("โหลดชุดคูปองไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  }
  useEffect(() => {
    void loadCouple();
    void loadSets();
  }, []);

  useEffect(() => {
    setSelectedSetId(setFromQuery);
  }, [setFromQuery]);

  function updateQuantity(templateId: number, quantity: number) {
    setCart((prev) => {
      const next = prev
        .map((i) => (i.couponTemplateId === templateId ? { ...i, quantity: quantityBound(quantity) } : i))
        .filter((i) => i.quantity > 0);
      giftCart.write(next);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    setError(null);

    if (!couple) {
      setError("ต้องจับคู่ก่อนจึงจะมอบคูปองได้");
      return;
    }

    if (!selectedSetId && cart.length === 0) {
      setError("ยังไม่ได้เลือกคูปอง — เลือกจากคลังคูปองหรือเลือกชุดสำเร็จรูปก่อน");
      return;
    }

    if (
      selectedSetId !== null &&
      (!setsReady || !sets.some((s) => s.id === selectedSetId && s.items.length > 0))
    ) {
      setError("ยังโหลดรายการของชุดที่เลือกไม่สำเร็จ กรุณาตรวจชุดอีกครั้ง");
      return;
    }
    if (
      !selectedSetId &&
      cart.some((i) => i.quantity < 1 || i.quantity > 100 || !Number.isInteger(i.quantity))
    ) {
      setError("จำนวนคูปองต้องอยู่ระหว่าง 1–100 ใบ");
      return;
    }
    const expiresAtUtc = expiryInstant(expiresAt);
    if (!expiresAtUtc) {
      setError("กรุณาเลือกวันหมดอายุตั้งแต่วันนี้เป็นต้นไป");
      return;
    }
    lock.current = true;
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

      if (!selectedSetId) {
        giftCart.clear();
        setCart([]);
      }
      setResult(gift);
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "มอบคูปองไม่สำเร็จ");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <Card variant="letter" className="gift-success space-y-4 text-center">
        <p aria-hidden="true" className="success-pop text-5xl">
          💝
        </p>
        <Notice>ของขวัญส่งถึงแฟนแล้ว</Notice>
        <h1 className="text-xl font-semibold">มอบคูปองสำเร็จ!</h1>
        <p className="text-muted">
          มอบให้ {couple?.partnerDisplayName} รวม {result.totalCoupons} ใบ หมดอายุ{" "}
          {formatDate(result.expiresAt)}
        </p>
        <ul className="mx-auto max-w-sm space-y-1 text-sm">
          {result.items.map((item) => (
            <li
              key={item.couponTemplateId}
              className="flex items-center justify-between rounded-lg bg-love-soft px-3 py-1.5"
            >
              <span>
                {item.emoji ?? "🎟️"} {item.name}
              </span>
              <span className="font-semibold">×{item.quantity}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-center gap-2">
          <LinkButton href="/sent-gifts" variant="secondary">
            ดูของขวัญที่ส่ง
          </LinkButton>
          <Button onClick={() => router.push("/dashboard")}>กลับบ้านของเรา</Button>
        </div>
      </Card>
    );
  }

  if (loadError) return <ErrorState message={loadError} retry={loadCouple} />;
  if (couple === undefined) return <Skeleton />;

  if (couple === null) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-4xl">💞</p>
        <h1 className="font-semibold">ยังไม่ได้จับคู่</h1>
        <p className="text-sm text-muted">ต้องจับคู่กับแฟนก่อนจึงจะมอบคูปองได้</p>
        <LinkButton href="/couple">ไปจับคู่</LinkButton>
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

      <fieldset disabled={submitting}>
        <Card variant="booklet" className="space-y-3">
          <h2>ทบทวนรายการก่อนส่ง</h2>
          <p className="text-sm text-muted">
            เลือกเองจากตะกร้า หรือเลือกชุดสำเร็จรูป — รายการเลือกเองจะเก็บไว้เมื่อส่งเป็นชุด
          </p>
          {setsError && <ErrorState message={setsError} retry={loadSets} />}
          <Field label="รูปแบบของขวัญ">
            <Select
              value={selectedSetId ?? ""}
              onChange={(e) => setSelectedSetId(e.target.value ? Number(e.target.value) : null)}
              disabled={submitting}
            >
              <option value="">— เลือกเองจากตะกร้า —</option>
              {sets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name} (รวม {set.totalCoupons} ใบ)
                </option>
              ))}
            </Select>
          </Field>

          {selectedSetId !== null && !selectedSet ? (
            <p role="status">{setsReady ? "ไม่พบชุดที่เลือก กรุณาเลือกใหม่" : "กำลังโหลดรายการชุด…"}</p>
          ) : selectedSet ? (
            <div className="rounded-lg bg-love-soft p-3 text-sm">
              <p className="font-semibold">{selectedSet.name}</p>
              <p className="mt-1 text-muted">
                {selectedSet.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted">
                ตะกร้าคูปอง ({cart.reduce((sum, i) => sum + i.quantity, 0)} ใบ) —{" "}
                <Link href="/catalog" className="text-love hover:underline">
                  ไปเลือกเพิ่มที่คลังคูปอง
                </Link>
              </p>
              {cart.length === 0 ? (
                <p className="rounded-lg border border-dashed border-control p-4 text-center text-sm text-muted">
                  ยังไม่มีคูปองในตะกร้า
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.couponTemplateId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-control p-3"
                  >
                    <span className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-lg">{item.emoji ?? "🎟️"}</span>
                      {item.name}
                      <RarityBadge rarity={item.rarity} />
                    </span>
                    <span className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`ลดจำนวน ${item.name}`}
                        disabled={submitting || item.quantity <= 1}
                        onClick={() => updateQuantity(item.couponTemplateId, item.quantity - 1)}
                      >
                        −
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`เพิ่มจำนวน ${item.name}`}
                        disabled={submitting || item.quantity >= 100}
                        onClick={() => updateQuantity(item.couponTemplateId, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={submitting}
                      aria-label={`ลบ ${item.name} ออกจากของขวัญ`}
                      onClick={() => {
                        const next = cart.filter((i) => i.couponTemplateId !== item.couponTemplateId);
                        setCart(next);
                        giftCart.write(next);
                      }}
                    >
                      ลบรายการ
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </fieldset>

      <fieldset disabled={submitting}>
        <Card variant="letter" className="grid gap-4 sm:grid-cols-2">
          <Field label="วันหมดอายุ">
            <Input
              type="date"
              value={expiresAt}
              min={localDate()}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
            />
          </Field>
          <Field label="ข้อความถึงแฟน (ไม่บังคับ)">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              placeholder="สุขสันต์วันครบรอบนะ 💕"
            />
          </Field>
        </Card>
      </fieldset>

      <ErrorText message={error} />

      <Button
        type="submit"
        disabled={
          submitting ||
          (selectedSetId !== null ? !setsReady || !selectedSet?.items.length : cart.length === 0)
        }
        className="w-full py-3 text-base"
      >
        {submitting ? "กำลังมอบ..." : "ยืนยันมอบคูปอง 💝"}
      </Button>
    </form>
  );
}

export default function NewGiftPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <NewGiftForm />
    </Suspense>
  );
}
