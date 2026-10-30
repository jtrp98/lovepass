"use client";

import {
  Button,
  EmptyState,
  ErrorState,
  ErrorText,
  Notice,
  PageTitle,
  Skeleton,
  formatDate,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import type { AdminCouple } from "@/types";

export default function AdminCouplesPage() {
  const [couples, setCouples] = useState<AdminCouple[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mutationLock = useRef(false);

  async function load() {
    setCouples(null);
    setLoadError(null);
    try {
      setCouples(await api.admin.couples());
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.displayMessage : "โหลดรายการไม่สำเร็จ");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const names = (couple: AdminCouple) => couple.members.map((m) => m.displayName).join(" & ");

  async function handleDissolve(couple: AdminCouple) {
    if (mutationLock.current) return;
    if (
      !window.confirm(
        `ยกเลิกคู่ "${names(couple)}"?\n(ไม่ลบข้อมูลใดๆ คูปองและความทรงจำที่เกิดขึ้นแล้วยังอยู่ครบ คำขอที่รออยู่จะถูกยกเลิกและคืนสิทธิ์ ทั้งสองคนจับคู่ใหม่ได้)`,
      )
    )
      return;
    mutationLock.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.admin.dissolveCouple(couple.id);
      setNotice(`ยกเลิกคู่ "${names(couple)}" แล้ว ความทรงจำของทั้งคู่ยังอยู่ครบ`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ยกเลิกคู่ไม่สำเร็จ ลองใหม่อีกครั้งนะ");
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="คู่รักทั้งหมด"
        subtitle="ยกเลิกคู่ได้โดยไม่ลบข้อมูล สิ่งที่เกิดขึ้นแล้วทั้งหมดคือความทรงจำ"
      />
      {notice && <Notice>{notice}</Notice>}
      <ErrorText message={error} />
      {busy && <p role="status">กำลังยกเลิกคู่…</p>}

      {loadError ? (
        <ErrorState message={loadError} retry={load} />
      ) : !couples ? (
        <Skeleton />
      ) : couples.length === 0 ? (
        <EmptyState title="ยังไม่มีคู่รักในระบบ" />
      ) : (
        <div className="admin-table overflow-x-auto rounded-xl border border-control bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-control bg-canvas text-left text-xs uppercase text-muted">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">คู่รัก</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">จับคู่เมื่อ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {couples.map((couple) => {
                const active = couple.status === "ACTIVE";
                return (
                  <tr key={couple.id} className="border-b border-control last:border-0">
                    <td data-label="รหัส" className="px-4 py-3 text-muted">
                      {couple.id}
                    </td>
                    <td data-label="คู่รัก" className="px-4 py-3">
                      {couple.members.map((m) => (
                        <p key={m.userId}>
                          <span className="font-semibold">{m.displayName}</span>{" "}
                          <span className="text-muted">{m.email}</span>
                        </p>
                      ))}
                    </td>
                    <td data-label="สถานะ" className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active ? "bg-lavender-soft text-lavender-ink" : "bg-canvas text-muted"
                        }`}
                      >
                        {active ? "จับคู่อยู่" : "ยกเลิกแล้ว"}
                      </span>
                    </td>
                    <td data-label="จับคู่เมื่อ" className="px-4 py-3 text-muted">
                      {formatDate(couple.createdAt)}
                    </td>
                    <td data-label="จัดการ" className="px-4 py-3 text-right">
                      {active && (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          onClick={() => handleDissolve(couple)}
                        >
                          ยกเลิกคู่
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
