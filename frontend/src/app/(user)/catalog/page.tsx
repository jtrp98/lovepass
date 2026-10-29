"use client";

import { Button, Card, EmptyState, PageTitle, RarityBadge, rarityStyles } from "@/components/ui";
import { api, giftCart, type CartItem } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CouponTemplate, Rarity } from "@/types";

const rarities: (Rarity | "ALL")[] = ["ALL", "COMMON", "RARE", "EPIC", "LEGENDARY"];

export default function CatalogPage() {
  const [templates, setTemplates] = useState<CouponTemplate[] | null>(null);
  const [filter, setFilter] = useState<Rarity | "ALL">("ALL");
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(giftCart.read());
  }, []);

  useEffect(() => {
    api.catalog
      .templates(filter === "ALL" ? undefined : filter)
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, [filter]);

  function addToCart(template: CouponTemplate, quantity: number) {
    if (quantity < 1) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.couponTemplateId === template.id);
      const next = existing
        ? prev.map((i) =>
            i.couponTemplateId === template.id
              ? { ...i, quantity: Math.min(100, i.quantity + quantity) }
              : i,
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
    <div className="space-y-6 pb-20">
      <PageTitle
        title="คลังคูปอง"
        subtitle="เลือกคูปองที่จะมอบให้แฟน แล้วกดเพิ่มลงตะกร้า"
        action={
          totalInCart > 0 ? (
            <Link href="/gifts/new">
              <Button>ตะกร้า ({totalInCart} ใบ) — ไปมอบคูปอง →</Button>
            </Link>
          ) : null
        }
      />

      <div className="flex flex-wrap gap-2">
        {rarities.map((rarity) => (
          <button
            key={rarity}
            onClick={() => setFilter(rarity)}
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

      {!templates ? (
        <p className="text-gray-400">กำลังโหลด...</p>
      ) : templates.length === 0 ? (
        <EmptyState title="ยังไม่มีคูปองในคลัง" hint="Admin ยังไม่ได้สร้าง Coupon Template" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`flex flex-col gap-2 border-2 ${rarityStyles[template.rarity].border}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-3xl">{template.emoji ?? "🎟️"}</p>
                <RarityBadge rarity={template.rarity} />
              </div>
              <p className="font-bold">{template.name}</p>
              <p className="text-sm text-gray-600">{template.description}</p>
              {template.terms ? <p className="text-xs text-gray-400">เงื่อนไข: {template.terms}</p> : null}
              <div className="mt-auto flex items-center gap-2 pt-2">
                <Button size="sm" variant="secondary" onClick={() => addToCart(template, 1)}>
                  +1 ใบ
                </Button>
                <Button size="sm" variant="secondary" onClick={() => addToCart(template, 5)}>
                  +5
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalInCart > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rose-200 bg-white/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <p className="truncate text-sm text-gray-600">
              ตะกร้า: {cart.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
            </p>
            <Link href="/gifts/new">
              <Button>ถัดไป →</Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
