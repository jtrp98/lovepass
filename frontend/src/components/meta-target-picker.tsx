"use client";

import { useCallback } from "react";
import type { MetaTarget } from "@/types";
import { api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { couponEffects, type MetaEffect } from "@/lib/coupon-effects";
import { Button, ErrorText, Field, Select, formatDate, rarityStyles } from "./ui";

export function metaTargetKey(target: MetaTarget) {
  return target.issuedCouponId ? `coupon-${target.issuedCouponId}` : `template-${target.couponTemplateId}`;
}

function describe(target: MetaTarget, effect: MetaEffect) {
  const tier = rarityStyles[target.rarity]?.label.split(" · ")[0] ?? target.rarity;
  if (effect === "WILDCARD") return `${target.name} · ${tier}`;
  if (effect === "REPLAY" || effect === "REPLAYGOLD") return `${target.name} · ${tier} · ใช้ไปแล้ว ${target.usedCount} ครั้ง`;
  return `${target.name} · ${tier}${target.expiresAt ? ` · ถึง ${formatDate(target.expiresAt)}` : ""}`;
}

/** Lets the receiver choose which coupon a power works on; the request is only sent once a target is picked. */
export function MetaTargetPicker({ couponId, effect, value, onChange }: {
  couponId: number;
  effect: MetaEffect;
  value: MetaTarget | null;
  onChange: (target: MetaTarget | null) => void;
}) {
  const loader = useCallback(() => api.coupons.metaTargets(couponId), [couponId]);
  const { data, error, loading, retry } = useResource(loader);

  if (loading) return <p className="pocket-terms" role="status">กำลังหาคูปองที่ใช้พลังนี้ได้…</p>;
  if (error) return (
    <div className="space-y-2">
      <ErrorText message={error} />
      <Button type="button" variant="ghost" onClick={retry}>ลองโหลดอีกครั้ง</Button>
    </div>
  );
  if (!data?.length) return (
    <p className="pocket-terms">
      {effect === "REPLAY" || effect === "REPLAYGOLD"
        ? "ยังไม่มีคูปองจากแฟนที่ใช้ไปแล้วและใช้ซ้ำได้ เก็บใบนี้ไว้ก่อน แล้วค่อยกลับมาเลือกนะ"
        : "ตอนนี้ยังไม่มีคูปองที่ใช้พลังนี้ได้ เก็บใบนี้ไว้ใช้ทีหลังได้นะ"}
    </p>
  );

  return (
    <div className="space-y-2">
      <Field label={couponEffects[effect].pick}>
        <Select value={value ? metaTargetKey(value) : ""} onChange={(e) => onChange(data.find((target) => metaTargetKey(target) === e.target.value) ?? null)}>
          <option value="">เลือกคูปอง</option>
          {data.map((target) => <option key={metaTargetKey(target)} value={metaTargetKey(target)}>{describe(target, effect)}</option>)}
        </Select>
      </Field>
      {value && <p className="pocket-terms whitespace-pre-line">เงื่อนไขของ {value.name}: {value.terms}</p>}
    </div>
  );
}
