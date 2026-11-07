"use client";

import { useState } from "react";
import type { ReceivedGift } from "@/types";
import { api, ApiError } from "@/lib/api";
import {
  Button,
  Dialog,
  ErrorText,
  LinkButton,
  Notice,
  formatDate,
  rarityStyles,
} from "./ui";
import { RarityPips } from "./love-ticket";
import { Envelope, StationeryIcon, WaxSeal } from "./stationery";
import { TicketIllustration } from "./ticket-illustration";
import { couponCategories, resolveCategory } from "@/lib/coupon-categories";
import { exportGiftStoryImage } from "@/lib/gift-share";

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
  const [sharing, setSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
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
      setError(
        err instanceof ApiError
          ? err.displayMessage
          : "เปิดของขวัญไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleShareStory() {
    if (sharing) return;
    setSharing(true);
    setShareNotice(null);
    try {
      const res = await exportGiftStoryImage(gift);
      if (res.success) {
        setShareNotice(
          res.method === "share"
            ? "เปิดเมนูแชร์ของเครื่องเรียบร้อยแล้ว"
            : "บันทึกรูปการ์ดลงเครื่องแล้ว นำไปอวดในสตอรี่ได้เลย!",
        );
      }
    } catch {
      setShareNotice("ไม่สามารถบันทึกภาพได้ กรุณาลองแคปหน้าจอแทนนะ");
    } finally {
      setSharing(false);
    }
  }

  return (
    <Dialog
      title={gift.title || "ของขวัญจากคนโปรด"}
      onClose={onClose}
      busy={busy}
      className="gift-keepsake-dialog"
    >
      <article className="gift-keepsake-sheet">
        {/* Analog Frame Corners */}
        <span className="gift-frame-corner gift-corner-tl" aria-hidden="true" />
        <span className="gift-frame-corner gift-corner-tr" aria-hidden="true" />
        <span className="gift-frame-corner gift-corner-bl" aria-hidden="true" />
        <span className="gift-frame-corner gift-corner-br" aria-hidden="true" />

        <div className="gift-keepsake-frame">
          {!opened ? (
            /* ── Sealed Envelope State ──────────────────────────────── */
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="pocket-mono">LOVE PASS ✦ FOR MY FAVORITE PERSON</span>
                <span className="pocket-mono font-bold text-stamp">
                  No. GF-{String(gift.id).padStart(4, "0")}
                </span>
              </div>

              <div className="pack-cover my-2">
                <Envelope open={false} animate={false}>
                  <span className="pocket-mono">A GIFT FOR YOU</span>
                  <strong>{total} ใบ</strong>
                  <span>จาก {gift.senderName}</span>
                </Envelope>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-ink">
                  มีของขวัญมาฝากเธอ 💌
                </h2>
                {gift.title ? (
                  <p className="font-display text-lg text-love">“{gift.title}”</p>
                ) : (
                  <p className="text-sm text-muted">
                    คำสัญญาและความใส่ใจที่ {gift.senderName} ตั้งใจเลือกให้
                  </p>
                )}
                <p className="text-sm text-muted">
                  แนบคำสัญญามาในซองรวม {total} ใบ
                </p>
              </div>

              {error && <ErrorText message={error} />}

              <Button
                className="w-full py-3 text-base shadow-md"
                disabled={busy}
                onClick={() => void handleOpen()}
              >
                <StationeryIcon name="letter" className="h-5 w-5 shrink-0" />
                {busy ? "กำลังเปิดผนึกของขวัญ…" : "เปิดซองของขวัญ 💌"}
              </Button>
            </div>
          ) : (
            /* ── Opened Keepsake Sheet State ─────────────────────────── */
            <div className="space-y-4">
              <header className="gift-keepsake-header">
                <span className="gift-postage-mark" aria-hidden="true" />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span className="pocket-mono">AIRMAIL ✦ PAR AVION</span>
                  <span className="pocket-mono font-bold text-stamp">
                    No. GF-{String(gift.id).padStart(4, "0")}
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-love">
                    ของขวัญจากใจ · FOR MY FAVORITE PERSON
                  </p>
                  <h2 className="text-2xl font-bold text-ink">
                    {gift.title ? `“${gift.title}”` : "คำสัญญาเล็ก ๆ ที่ตั้งใจมอบให้"}
                  </h2>
                  <p className="text-sm text-muted">
                    มอบโดย <strong className="text-ink">{gift.senderName}</strong> 💖 รวมคำสัญญา {total} ใบ
                  </p>
                </div>
              </header>

              {/* Flourish divider */}
              <div className="text-center" aria-hidden="true">
                <img
                  src="/materials/tickets/flourish-heart.svg"
                  alt=""
                  className="gift-flourish"
                />
              </div>

              {/* Handwritten Note with washi tape & wax seal */}
              {gift.message && (
                <div className="gift-keepsake-note">
                  <span className="gift-note-tape" aria-hidden="true" />
                  <p className="pocket-mono text-xs text-muted">
                    A NOTE FOR YOU · เขียนไว้ให้เธอ
                  </p>
                  <p className="pack-letter-note font-display whitespace-pre-wrap text-base text-ink">
                    “{gift.message}”
                  </p>
                  <p className="mt-1 text-right font-display text-xs italic text-muted">
                    — ด้วยรัก, {gift.senderName}
                  </p>
                  <div className="gift-note-seal" aria-hidden="true">
                    <WaxSeal />
                  </div>
                </div>
              )}

              {/* Perforation Divider */}
              <div className="pocket-perforation my-3" aria-hidden="true" />

              {/* Attached Mini Tickets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink">
                    คำสัญญาที่แนบมาในซอง · {total} ใบ
                  </h3>
                  <span className="pocket-mono text-xs text-muted">TICKETS ATTACHED</span>
                </div>

                <ul className="gift-attached-tickets" aria-label="รายการคูปองในซองของขวัญ">
                  {gift.coupons.map((coupon, idx) => (
                    <li
                      key={idx}
                      className="gift-attached-ticket"
                      data-rarity={coupon.rarity}
                    >
                      <div className="gift-ticket-icon">
                        <TicketIllustration category={coupon.category} />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-semibold">
                            {couponCategories[resolveCategory(coupon.category)].label}
                          </span>
                          <span>·</span>
                          <RarityPips rarity={coupon.rarity} />
                          <span>
                            {rarityStyles[coupon.rarity]?.label.split(" · ")[0]}
                          </span>
                        </div>
                        <h4 className="truncate font-semibold text-ink">
                          {coupon.name}
                        </h4>
                        {coupon.description && (
                          <p className="line-clamp-2 text-xs text-muted">
                            {coupon.description}
                          </p>
                        )}
                        <p className="text-[11px] text-muted">
                          เก็บไว้ใช้ได้ถึง {formatDate(coupon.expiresAt)}
                        </p>
                      </div>
                      <div className="gift-ticket-stamp-qty">
                        ×{coupon.quantity} ใบ
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {shareNotice && <Notice>{shareNotice}</Notice>}

              {/* Action Bar */}
              <footer className="gift-action-bar pt-3">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  disabled={sharing}
                  onClick={() => void handleShareStory()}
                >
                  <StationeryIcon name="letter" className="h-5 w-5 shrink-0" />
                  {sharing ? "กำลังเตรียมรูปการ์ด…" : "📸 แชร์การ์ดอวดโซเชียล"}
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" onClick={onClose}>
                    เก็บไว้ในความทรงจำ
                  </Button>
                  <LinkButton href="/my-coupons">
                    <StationeryIcon name="ticket" className="h-5 w-5 shrink-0" />
                    เปิดกระเป๋าตั๋วของฉัน
                  </LinkButton>
                </div>
              </footer>
            </div>
          )}
        </div>
      </article>
    </Dialog>
  );
}
