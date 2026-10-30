"use client";

import {
  Button,
  Card,
  Skeleton,
  Notice,
  ErrorState,
  ErrorText,
  Field,
  Input,
  PageTitle,
  formatDate,
} from "@/components/ui";
import { invitationCode } from "@/lib/flow";
import { ApiError, api } from "@/lib/api";
import { useEffect, useState } from "react";
import type { CoupleInfo, InvitationResult } from "@/types";
import { LoveDoodle } from "@/components/love-doodle";

export default function CouplePage() {
  const [couple, setCouple] = useState<CoupleInfo | null | undefined>(undefined);
  const [invitation, setInvitation] = useState<InvitationResult | null>(null);
  const [acceptToken, setAcceptToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  async function load() {
    setLoadError(null);
    setCouple(undefined);
    try {
      setCouple(await api.couples.me());
    } catch {
      setLoadError("โหลดข้อมูลคู่ไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate() {
    if (busy) return;
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
      const code = invitationCode(acceptToken, window.location.origin);
      if (!code) {
        setError("กรุณาวางรหัสคำเชิญหรือลิงก์ LOVE PASS ที่แฟนส่งมาให้ครบ");
        return;
      }
      await api.couples.acceptInvitation(code);
      setAcceptToken("");
      setNotice("จับคู่สำเร็จ 🎉");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ยอมรับคำเชิญไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (loadError) return <ErrorState message={loadError} retry={load} />;
  if (couple === undefined) return <Skeleton />;

  if (couple) {
    return (
      <div className="space-y-6">
        <PageTitle title="คู่ของฉัน" subtitle="ข้อมูลคู่รักที่จับคู่ไว้" />
        <Card variant="journal" className="couple-story space-y-3 text-center">
          <LoveDoodle />
          <p className="text-lg font-semibold">คุณ & {couple.partnerDisplayName}</p>
          <p className="text-sm text-muted">{couple.partnerEmail}</p>
          <p className="text-sm text-muted">จับคู่เมื่อ {formatDate(couple.coupledSince)}</p>
        </Card>
        {notice && <Notice>{notice}</Notice>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="คู่ของฉัน" subtitle="ยังไม่ได้จับคู่ — สร้างคำเชิญส่งให้แฟน หรือใส่รหัสที่แฟนส่งมา" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="letter" className="space-y-3">
          <p className="font-semibold">ส่งคำเชิญให้แฟน</p>
          <p className="text-sm text-muted">ส่งลิงก์นี้ให้แฟน ให้กดเข้ามายอมรับ (อายุ 7 วัน)</p>
          <Button onClick={handleCreate} disabled={busy}>
            {busy ? "กำลังสร้าง..." : "สร้างคำเชิญ"}
          </Button>

          {invitation ? (
            <div className="space-y-2 rounded-lg bg-love-soft p-3">
              <p className="text-xs font-medium text-love">ลิงก์คำเชิญ (คัดลอกส่งให้แฟน):</p>
              <code className="block break-all rounded bg-surface p-2 text-xs">{invitation.inviteLink}</code>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(invitation.inviteLink);
                    setNotice("คัดลอกลิงก์แล้ว ส่งให้แฟนได้เลย");
                  } catch {
                    setError("คัดลอกอัตโนมัติไม่ได้ กรุณาเลือกลิงก์ด้านบนแล้วคัดลอกเอง");
                  }
                }}
              >
                คัดลอกลิงก์
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    if (navigator.share)
                      await navigator.share({
                        title: "มาเป็นคู่กันใน LOVE PASS",
                        url: invitation.inviteLink,
                      });
                    else {
                      await navigator.clipboard.writeText(invitation.inviteLink);
                      setNotice("คัดลอกลิงก์แล้ว ส่งให้แฟนได้เลย");
                    }
                  } catch (err) {
                    if (!(err instanceof DOMException && err.name === "AbortError"))
                      setError("แชร์ไม่ได้ กรุณาคัดลอกลิงก์ด้านบนส่งให้แฟน");
                  }
                }}
              >
                แชร์คำเชิญ
              </Button>
            </div>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <p className="font-semibold">ฉันมีคำเชิญแล้ว</p>
          <form onSubmit={handleAccept} className="space-y-3">
            <Field label="รหัสคำเชิญหรือลิงก์">
              <Input
                value={acceptToken}
                onChange={(e) => setAcceptToken(e.target.value)}
                placeholder="วางรหัสที่แฟนส่งมา"
                required
              />
            </Field>
            <Button type="submit" disabled={busy}>
              {busy ? "กำลังจับคู่..." : "ยอมรับคำเชิญ"}
            </Button>
          </form>
        </Card>
      </div>

      {notice && <Notice>{notice}</Notice>}
      <ErrorText message={error} />
    </div>
  );
}
