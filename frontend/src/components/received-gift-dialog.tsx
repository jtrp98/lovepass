"use client";

import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import type { ReceivedGift } from "@/types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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
import { Envelope, StationeryIcon } from "./stationery";
import { LoveDoodle } from "./love-doodle";
import { TicketIllustration } from "./ticket-illustration";
import { couponCategories, resolveCategory } from "@/lib/coupon-categories";
import {
  buildKeepsakeCopy,
  defaultCouponDescription,
  exportGiftStoryImage,
} from "@/lib/gift-share";

export function ReceivedGiftDialog({
  gift,
  recipientName,
  onClose,
  onOpened,
}: {
  gift: ReceivedGift;
  recipientName?: string;
  onClose: () => void;
  onOpened?: (updated: ReceivedGift) => void;
}) {
  const { user } = useAuth();
  const effectiveRecipientName = recipientName || user?.displayName || "เธอ";
  const copy = buildKeepsakeCopy(gift, effectiveRecipientName);

  const [opened, setOpened] = useState(!!gift.openedAt);
  const [busy, setBusy] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = gift.coupons.reduce((sum, c) => sum + c.quantity, 0);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && screenshotMode) {
        e.stopPropagation();
        setScreenshotMode(false);
      }
    }
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [screenshotMode]);

  async function handleOpen() {
    if (busy || opened) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.gifts.open(gift.id);
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
      const res = await exportGiftStoryImage(gift, {
        recipientName: effectiveRecipientName,
      });
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
      className={`gift-keepsake-dialog ${screenshotMode ? "is-screenshot-mode" : ""}`}
    >
      {!opened ? (
        /* ── Sealed Envelope State ──────────────────────────────── */
        <article className="gift-keepsake-sheet">
          <div className="gift-keepsake-frame space-y-4 text-center">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="pocket-mono">
                A LITTLE GIFT · FOR {effectiveRecipientName.toUpperCase()}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                aria-label="ปิดของขวัญ"
                className="h-8 w-8 min-h-0 min-w-0 p-0 rounded-full flex items-center justify-center"
              >
                <LuX className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="pack-cover my-2">
              <Envelope open={false} animate={false}>
                <span className="pocket-mono">
                  FOR {effectiveRecipientName.toUpperCase()}
                </span>
                <strong>{total} ใบ</strong>
                <span>จาก {gift.senderName}</span>
              </Envelope>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-ink">
                มีของขวัญมาฝากเธอ
              </h2>
              {gift.title ? (
                <p className="font-display text-lg text-love">“{gift.title}”</p>
              ) : (
                <p className="text-sm text-muted">
                  คำสัญญาและความใส่ใจจาก {gift.senderName}
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
              {busy ? "กำลังเปิดซองของขวัญ…" : "ค่อย ๆ เปิดซองของขวัญ ♡"}
            </Button>
          </div>
        </article>
      ) : (
        /* ── Opened Keepsake Sheet State ─────────────────────────── */
        <>
          <article className="gift-keepsake-sheet">
            {/* Washi Tapes on Corners & Center Bow */}
            <span
              className="gift-corner-tape gift-corner-tape-left"
              aria-hidden="true"
            />
            <span
              className="gift-corner-tape gift-corner-tape-right"
              aria-hidden="true"
            />
            <img
              src="/materials/illustrations/ribbon-bow.svg"
              alt=""
              className="gift-center-bow"
              aria-hidden="true"
            />

            <div className="gift-keepsake-frame space-y-4">
              {/* Header: Salutation, Date Stamp & Title */}
              <header className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="gift-salutation">{copy.salutation}</p>
                  <div className="flex items-center gap-2">
                    <span className="gift-date-stamp pocket-mono">
                      {copy.dateStamp}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onClose}
                      aria-label="ปิดการ์ดของขวัญ"
                      className="gift-close-btn h-7 w-7 min-h-0 min-w-0 p-0 rounded-full flex items-center justify-center text-muted hover:text-ink"
                    >
                      <LuX className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <h2 className="gift-headline">{copy.headline}</h2>
              </header>

              {/* Pinned Torn-Paper Note (ONLY when sender provided a message) */}
              {copy.hasCustomMessage && (
                <div className="gift-torn-note">
                  <span className="gift-torn-note-tape" aria-hidden="true" />
                  <p
                    className={
                      copy.isLongNote ? "gift-note-long" : "gift-note-short"
                    }
                  >
                    “{copy.noteBody}”
                  </p>
                  {copy.signature && (
                    <p className="gift-note-sign">{copy.signature}</p>
                  )}
                </div>
              )}

              {/* Handmade Promises / Coupons Section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="gift-section-title">
                    HANDMADE PROMISES · คำสัญญาจากใจ
                  </span>
                  <span className="pocket-mono text-xs text-muted">
                    {total} ใบสำหรับเธอ
                  </span>
                </div>

                <ul
                  className="gift-handmade-tickets"
                  aria-label="รายการคูปองในของขวัญชุดนี้"
                >
                  {gift.coupons.map((coupon, idx) => {
                    const catKey = resolveCategory(coupon.category);
                    const desc =
                      coupon.description?.trim() ||
                      defaultCouponDescription(catKey, coupon.name);

                    return (
                      <li
                        key={idx}
                        className="gift-handmade-ticket"
                        data-rarity={coupon.rarity}
                      >
                        <div className="gift-ticket-icon">
                          <TicketIllustration category={coupon.category} />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="font-semibold">
                              {couponCategories[catKey].label}
                            </span>
                            <span>·</span>
                            <RarityPips rarity={coupon.rarity} />
                            <span>
                              {
                                rarityStyles[coupon.rarity]?.label.split(
                                  " · ",
                                )[0]
                              }
                            </span>
                          </div>
                          <h4 className="font-semibold text-ink leading-snug">
                            {coupon.name}
                          </h4>
                          <p className="gift-ticket-desc">{desc}</p>
                          <p className="text-[11px] text-muted">
                            เก็บไว้ใช้ได้ถึง {formatDate(coupon.expiresAt)}
                          </p>
                        </div>
                        <div className="gift-ticket-stub">
                          <span className="gift-ticket-stamp-qty">
                            ×{coupon.quantity}
                          </span>
                          <span className="text-[11px] text-muted">
                            ใบสำหรับเธอ
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Closing Couple Vignette */}
              <div
                className="gift-closing-doodle mx-auto w-24 pt-3 pb-1"
                aria-hidden="true"
              >
                <LoveDoodle />
              </div>

              {/* Footnote on Keepsake Sheet */}
              <p className="gift-sheet-footnote">{copy.footnote}</p>
            </div>
          </article>

          {/* Screenshot Mode Exit Controller */}
          {screenshotMode ? (
            <div className="gift-screenshot-exit-bar">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setScreenshotMode(false)}
                className="shadow-lg backdrop-blur-sm"
              >
                <StationeryIcon name="camera" className="h-4 w-4 shrink-0" />
                แสดงปุ่มควบคุม (หรือกด Esc)
              </Button>
            </div>
          ) : (
            /* External Floating Control Dock */
            <div className="space-y-2">
              {shareNotice && <Notice>{shareNotice}</Notice>}

              <nav
                className="gift-keepsake-dock"
                aria-label="การจัดการของขวัญ"
              >
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  disabled={sharing}
                  onClick={() => void handleShareStory()}
                >
                  <StationeryIcon name="story" className="h-5 w-5 shrink-0" />
                  {sharing
                    ? "กำลังเตรียมรูปการ์ด…"
                    : "แชร์ลงสตอรี่ (1080×1920)"}
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setScreenshotMode(true)}
                  >
                    <StationeryIcon
                      name="camera"
                      className="h-4 w-4 shrink-0"
                    />
                    โหมดแคปหน้าจอ
                  </Button>
                  <LinkButton href="/my-coupons" variant="secondary">
                    <StationeryIcon
                      name="ticket"
                      className="h-5 w-5 shrink-0"
                    />
                    ไปใช้คูปองในกระเป๋า
                  </LinkButton>
                  <Button variant="ghost" onClick={onClose}>
                    เก็บไว้ก่อน
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </>
      )}
    </Dialog>
  );
}
