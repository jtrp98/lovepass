"use client";

import {
  Button,
  LinkButton,
  Notice,
  ErrorState,
  Skeleton,
  EmptyState,
  RarityBadge,
} from "@/components/ui";
import { GiftExperienceHeader, GiftViews } from "@/components/nav";
import { LoveTicket, type LoveTicketData } from "@/components/love-ticket";
import { useResource } from "@/lib/use-resource";
import { api, giftCart, type CartItem } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import type { CouponTemplate, Rarity } from "@/types";
import { couponCategories, resolveCategory, type CouponCategory } from "@/lib/coupon-categories";

const categories: (CouponCategory | "ALL")[] = [
  "ALL",
  "AFFECTION",
  "TOGETHER",
  "FOOD",
  "CARE",
  "WISH",
  "ADVENTURE",
  "GIFT",
  "POWER",
  "OTHER",
];

const rarities: (Rarity | "ALL")[] = ["ALL", "COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"];
const CATALOG_STATE_KEY = "lovepass.catalogState";

function toTicket(template: CouponTemplate): LoveTicketData {
  return { id: `LP-${String(template.id).padStart(4, "0")}`, name: template.name, note: template.description, terms: template.terms, rarity: template.rarity, category: template.category, state: "available" };
}

export default function CatalogPage() {
  const [categoryFilter, setCategoryFilter] = useState<CouponCategory | "ALL">("ALL");
  const [filter, setFilter] = useState<Rarity | "ALL">("ALL");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<CouponTemplate | null>(null);
  const [rarityMenuOpen, setRarityMenuOpen] = useState(false);
  const rarityMenuRef = useRef<HTMLDivElement>(null);

  // Restore category & rarity state from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CATALOG_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.category) setCategoryFilter(parsed.category);
        if (parsed.rarity) setFilter(parsed.rarity);
      }
    } catch {}
  }, []);

  // Save state when filters change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        CATALOG_STATE_KEY,
        JSON.stringify({ category: categoryFilter, rarity: filter })
      );
    } catch {}
  }, [categoryFilter, filter]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!rarityMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (rarityMenuRef.current && !rarityMenuRef.current.contains(e.target as Node)) {
        setRarityMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setRarityMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [rarityMenuOpen]);

  useEffect(() => {
    setCart(giftCart.read());
  }, []);

  const resource = useResource(api.catalog.templates);
  const templates = resource.data?.filter((template) => {
    const matchesRarity = filter === "ALL" || template.rarity === filter;
    const matchesCategory = categoryFilter === "ALL" || resolveCategory(template.category) === categoryFilter;
    return matchesRarity && matchesCategory;
  });
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
    <div className="pocket-book space-y-6 pb-32">
      <GiftExperienceHeader />
      <GiftViews />

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted">หมวดหมู่</p>
          <div className="filter-scroll-row" role="group" aria-label="หมวดหมู่คูปอง">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={categoryFilter === category}
                onClick={() => setCategoryFilter(category)}
                className="category-filter"
              >
                {category === "ALL" ? "ทั้งหมด" : couponCategories[category].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted">ระดับความพิเศษ</p>

          {/* Mobile: Compact Dropdown */}
          <div ref={rarityMenuRef} className="md:hidden relative inline-block">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={rarityMenuOpen}
              aria-label="เลือกระดับความพิเศษ"
              onClick={() => setRarityMenuOpen((prev) => !prev)}
              className="inline-flex min-h-11 items-center justify-between gap-3 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink shadow-xs"
            >
              <span className="flex items-center gap-1.5 font-medium">
                {filter === "ALL" ? "✨ ทุกระดับ" : <RarityBadge rarity={filter} />}
              </span>
              <span
                className="text-muted text-xs transition-transform duration-200"
                style={{ transform: rarityMenuOpen ? "rotate(180deg)" : "none" }}
                aria-hidden="true"
              >
                ▾
              </span>
            </button>
            {rarityMenuOpen && (
              <div
                role="listbox"
                aria-label="ประเภทคูปอง"
                className="absolute left-0 top-full z-20 mt-1.5 flex flex-col gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-lg min-w-56"
              >
                {rarities.map((rarity) => (
                  <button
                    key={rarity}
                    type="button"
                    role="option"
                    aria-selected={filter === rarity}
                    onClick={() => {
                      setFilter(rarity);
                      setRarityMenuOpen(false);
                    }}
                    className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      filter === rarity ? "bg-love-soft font-semibold text-love" : "text-ink hover:bg-canvas"
                    }`}
                  >
                    <span>{rarity === "ALL" ? "✨ ทุกระดับ" : <RarityBadge rarity={rarity} />}</span>
                    {filter === rarity && <span className="text-love text-xs font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: Chips */}
          <div className="hidden md:flex flex-wrap gap-2" role="group" aria-label="ประเภทคูปอง">
            {rarities.map((rarity) => (
              <button
                key={rarity}
                type="button"
                aria-pressed={filter === rarity}
                onClick={() => setFilter(rarity)}
                className="rarity-filter"
              >
                {rarity === "ALL" ? "ทุกประเภท" : <RarityBadge rarity={rarity} />}
              </button>
            ))}
          </div>
        </div>
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
        <div className="pocket-collection">
          {templates.map((template) => (
            <LoveTicket key={template.id} ticket={toTicket(template)} catalog open={selected?.id === template.id} onClose={() => setSelected(null)} onOpen={() => {
              setFeedback(null);
              setSelected(template);
            }}>
              {feedback?.id === template.id && <Notice>{feedback.text}</Notice>}
              <Button onClick={() => addToCart(template, 1)}>เพิ่มลงของขวัญ</Button>
            </LoveTicket>
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
