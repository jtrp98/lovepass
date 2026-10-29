"use client";

import { Button, Card, ErrorText, Field, Input, PageTitle, formatDate } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { CoupleInfo, InvitationResult } from "@/types";

export default function CouplePage() {
  const [couple, setCouple] = useState<CoupleInfo | null | undefined>(undefined);
  const [invitation, setInvitation] = useState<InvitationResult | null>(null);
  const [acceptToken, setAcceptToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setCouple(await api.couples.me());
    } catch {
      setCouple(null); // แสดง UI จับคู่ต่อได้แทนค้างที่ "กำลังโหลด"
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate() {
    setError(null);
    setBusy(true);
    try {
      setInvitation(await api.couples.createInvitation());
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "สร้างคำเชิญไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.couples.acceptInvitation(acceptToken.trim());
      setAcceptToken("");
      setNotice("จับคู่สำเร็จ 🎉");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ยอมรับคำเชิญไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (couple === undefined) return <p className="text-gray-400">กำลังโหลด...</p>;

  if (couple) {
    return (
      <div className="space-y-6">
        <PageTitle title="คู่ของฉัน" subtitle="ข้อมูลคู่รักที่จับคู่ไว้" />
        <Card className="space-y-3 text-center">
          <p className="text-4xl">💑</p>
          <p className="text-lg font-bold">
            คุณ & {couple.partnerDisplayName}
          </p>
          <p className="text-sm text-gray-500">{couple.partnerEmail}</p>
          <p className="text-sm text-gray-500">จับคู่เมื่อ {formatDate(couple.coupledSince)}</p>
        </Card>
        {notice ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="คู่ของฉัน" subtitle="ยังไม่ได้จับคู่ — สร้างคำเชิญส่งให้แฟน หรือใส่โทเคนที่แฟนส่งมา" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <p className="font-semibold">1) สร้างคำเชิญของฉัน</p>
          <p className="text-sm text-gray-500">ส่งลิงก์นี้ให้แฟน ให้กดเข้ามายอมรับ (อายุ 7 วัน)</p>
          <Button onClick={handleCreate} disabled={busy}>
            {busy ? "กำลังสร้าง..." : "สร้างคำเชิญ"}
          </Button>

          {invitation ? (
            <div className="space-y-2 rounded-lg bg-rose-50 p-3">
              <p className="text-xs font-medium text-rose-700">ลิงก์คำเชิญ (คัดลอกส่งให้แฟน):</p>
              <code className="block break-all rounded bg-white p-2 text-xs">{invitation.inviteLink}</code>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigator.clipboard?.writeText(invitation.inviteLink)}
              >
                คัดลอกลิงก์
              </Button>
            </div>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <p className="font-semibold">2) ยอมรับคำเชิญของแฟน</p>
          <form onSubmit={handleAccept} className="space-y-3">
            <Field label="โทเคนคำเชิญ">
              <Input
                value={acceptToken}
                onChange={(e) => setAcceptToken(e.target.value)}
                placeholder="วางโทเคนที่แฟนส่งมา"
                required
              />
            </Field>
            <Button type="submit" disabled={busy}>
              {busy ? "กำลังจับคู่..." : "ยอมรับคำเชิญ"}
            </Button>
          </form>
        </Card>
      </div>

      {notice ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p> : null}
      <ErrorText message={error} />
    </div>
  );
}
