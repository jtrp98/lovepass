"use client";

import { useState } from "react";
import type { ReceivedGift } from "@/types";
import { api, ApiError } from "@/lib/api";
import { Button, Card, Dialog, ErrorText, LinkButton, RarityBadge, formatDate } from "./ui";
import { Envelope, StationeryIcon } from "./stationery";
import { TicketIllustration } from "./ticket-illustration";
import { couponCategories, resolveCategory } from "@/lib/coupon-categories";

export function ReceivedGiftDialog({
  gift,
  onClose,
  onOpened,
}: {
  gift: ReceivedGift;
  onClose: () => void;
  onOpened?: (updated: ReceivedGift) => void;
}) {
  const [opened, setOpened] = useState(!!gift.openedAt);
  const [justOpened, setJustOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = gift.coupons.reduce((sum, c) => sum + c.quantity, 0);

  async function handleOpen() {
    if (busy || opened) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.gifts.open(gift.id);
      setJustOpened(true);
      setOpened(true);
      onOpened?.(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "เปิดของขวัญไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title={gift.title || "ของขวัญจากแฟน"} onClose={onClose} busy={busy}>
      <div className="space-y-6 text-center">
        <div className="pack-cover">
          <Envelope open={opened} animate={justOpened}>
            <span className="pocket-mono">SPECIAL GIFT FOR YOU</span>
            <strong>{total} ใบ</strong>
            <span>จาก {gift.senderName}</span>
          </Envelope>
        </div>

        {!opened ? (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">คุณได้รับของขวัญจาก {gift.senderName} 💝</h2>
            {gift.title && <p className="font-display text-lg text-love">“{gift.title}”</p>}
            <p className="text-sm text-muted">มีคำสัญญาและความใส่ใจมอบให้คุณรวม {total} ใบ</p>
            {error && <ErrorText message={error} />}
            <Button
              className="w-full py-3 text-base"
              disabled={busy}
              onClick={() => void handleOpen()}
            >
              <StationeryIcon name="letter" className="h-5 w-5 shrink-0" />
              {busy ? "กำลังเปิดผนึกของขวัญ…" : "แตะเพื่อแกะตราครั่งและเปิดดูของขวัญ"}
            </Button>
          </div>
        ) : (
          <div className="space-y-5 text-left">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-love">
                {gift.title ? `“${gift.title}”` : "ของขวัญจากใจ"}
              </h2>
              <p className="text-sm text-muted">
                มอบโดย {gift.senderName} · รวม {total} ใบ
              </p>
            </div>

            {gift.message && (
              <Card variant="letter" className="space-y-1 bg-love-soft/40">
                <p className="pocket-mono text-xs text-muted">ข้อความจากการ์ดถึงคุณ</p>
                <p className="pack-letter-note font-display whitespace-pre-wrap text-base">
                  “{gift.message}”
                </p>
              </Card>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">คูปองที่คุณได้รับ</h3>
              <ul className="space-y-2.5">
                {gift.coupons.map((coupon, idx) => (
                  <li
                    key={idx}
                    className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0">
                        <TicketIllustration category={coupon.category} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{coupon.name}</span>
                          <RarityBadge rarity={coupon.rarity} />
                          <span className="text-xs text-muted">
                            ({couponCategories[resolveCategory(coupon.category)].label})
                          </span>
                        </div>
                        {coupon.description && (
                          <p className="text-sm text-muted">{coupon.description}</p>
                        )}
                        <p className="text-xs text-muted">
                          หมดอายุ: {formatDate(coupon.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right sm:shrink-0">
                      <span className="inline-block rounded-md bg-love-soft px-2.5 py-1 text-sm font-semibold text-love">
                        ×{coupon.quantity} ใบ
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose}>
                ปิดหน้าต่าง
              </Button>
              <LinkButton href="/my-coupons">
                <StationeryIcon name="ticket" className="h-5 w-5 shrink-0" />
                เปิดกระเป๋าคูปองของฉัน
              </LinkButton>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
