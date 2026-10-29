"use client";

import {
  Button,
  CouponCard,
  LinkButton,
  Notice,
  ErrorState,
  Skeleton,
  EmptyState,
  PageTitle,
  RarityBadge,
} from "@/components/ui";
import { GiftViews } from "@/components/nav";
import { useResource } from "@/lib/use-resource";
import { api, giftCart, type CartItem } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import type { CouponTemplate, Rarity } from "@/types";

const rarities: (Rarity | "ALL")[] = ["ALL", "COMMON", "RARE", "EPIC", "LEGENDARY"];

export default function CatalogPage() {
  const [filter, setFilter] = useState<Rarity | "ALL">("ALL");
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(giftCart.read());
  }, []);

  const resource = useResource(
    useCallback(() => api.catalog.templates(filter === "ALL" ? undefined : filter), [filter]),
  );
  const templates = resource.data;
  const [feedback, setFeedback] = useState<{ id: number; text: string } | null>(null);

  function addToCart(template: CouponTemplate, quantity: number) {
    if (quantity < 1) return;
    const before = cart.find((i) => i.couponTemplateId === template.id)?.quantity ?? 0;
    setFeedback({
      id: template.id,
      text: before >= 100 ? `เลือก ${template.name} ครบ 100 ใบแล้ว` : `เพิ่ม ${template.name} 1 ใบแล้ว`,
    });
    setCart((prev) => {
      const existing = prev.find((i) => i.couponTemplateId === template.id);
      const next = existing
        ? prev.map((i) =>
            i.couponTemplateId === template.id ? { ...i, quantity: Math.min(100, i.quantity + quantity) } : i,
          )
        : [
            ...prev,
            {
              couponTemplateId: template.id,
              name: template.name,
              emoji: template.emoji,
              rarity: template.rarity,
              quantity,
            },
          ];
      giftCart.write(next);
      return next;
    });
  }

  const totalInCart = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6 pb-32">
      <PageTitle title="วันนี้อยากให้แฟนได้อะไรดี?" subtitle="เลือกคูปองที่จะมอบให้แฟน แล้วกดเพิ่มลงตะกร้า" />

      <GiftViews />
      <div className="flex flex-wrap gap-2">
        {rarities.map((rarity) => (
          <button
            key={rarity}
            aria-pressed={filter === rarity}
            onClick={() => setFilter(rarity)}
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

      {resource.error ? (
        <ErrorState message={resource.error} retry={resource.retry} />
      ) : resource.loading || !templates ? (
        <Skeleton />
      ) : templates.length === 0 ? (
        <EmptyState
          title="ยังไม่มีคูปองในคลัง"
          hint="ลองเปลี่ยนประเภท หรือเลือกเป็นชุดได้"
          action={
            <LinkButton href="/sets" variant="secondary">
              ดูชุดคูปอง
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <CouponCard rarity={template.rarity} key={template.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-3xl">{template.emoji ?? "🎟️"}</p>
                <RarityBadge rarity={template.rarity} />
              </div>
              <p className="font-semibold">{template.name}</p>
              <p className="text-sm text-muted">{template.description}</p>
              {template.terms ? <p className="text-sm text-muted">เงื่อนไข: {template.terms}</p> : null}
              <div className="mt-auto space-y-2 pt-3">
                <Button className="w-full" variant="secondary" onClick={() => addToCart(template, 1)}>
                  เพิ่มลงของขวัญ
                </Button>
                {feedback?.id === template.id && <Notice>{feedback.text}</Notice>}
              </div>
            </CouponCard>
          ))}
        </div>
      )}

      {totalInCart > 0 ? (
        <div className="cart-bar fixed inset-x-0 z-30 border-t border-control bg-surface p-3">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              เลือกแล้ว <strong>{totalInCart} ใบ</strong>
            </p>
            <LinkButton href="/gifts/new">ตรวจของขวัญ</LinkButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
