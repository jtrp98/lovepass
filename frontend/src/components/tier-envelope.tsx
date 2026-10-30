"use client";

import type { Rarity } from "@/types";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Envelope } from "./stationery";
import { Button, Card, RarityBadge } from "./ui";

export function TierEnvelope({ rarity, quantity, received = 0, open = false, animate = false, active = false, disabled = false, onOpen, children }: {
  rarity: Rarity;
  quantity: number;
  received?: number;
  open?: boolean;
  animate?: boolean;
  active?: boolean;
  disabled?: boolean;
  onOpen?: () => void;
  children?: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (animate) heading.current?.focus(); }, [animate]);
  return <div className="tier-envelope" data-rarity={rarity} data-active={active || undefined}><Card className="space-y-3">
    <RarityBadge rarity={rarity} />
    <Envelope rarity={rarity} open={open} animate={animate}><span>{rarity}</span><strong>{quantity} ใบ</strong><span>เลือกเอง หรือสุ่มก็ได้</span></Envelope>
    <h3 ref={heading} tabIndex={onOpen ? -1 : undefined} className="font-display text-lg">ซอง {rarity} · {quantity} ใบ</h3>
    <p className="text-sm">{received ? `รับแล้ว ${received} ใบ · เหลือ ${quantity - received} ใบ` : "แบ่งเปิดทีละใบ หรือเปิดหลายใบพร้อมกัน"}</p>
    {onOpen && <Button variant={active ? "primary" : "secondary"} className="w-full" disabled={disabled} aria-pressed={active} onClick={onOpen}>
      {open ? `เลือกจากซอง ${rarity}` : `เปิดซอง ${rarity}`}
    </Button>}
    {children}
  </Card></div>;
}
