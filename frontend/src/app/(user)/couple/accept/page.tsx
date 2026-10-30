"use client";

import { Button, Card, LinkButton, Skeleton, ErrorText } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { WaxSeal } from "@/components/stationery";

function AcceptForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await api.couples.acceptInvitation(token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ยอมรับคำเชิญไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card variant="letter" className="space-y-4 text-center">
      <WaxSeal className="mx-auto" />
      <h1 className="text-lg font-semibold">ยอมรับคำเชิญจับคู่</h1>
      {token ? (
        <>
          <p className="text-sm text-muted">กดปุ่มด้านล่างเพื่อจับคู่กับคนที่ส่งคำเชิญนี้</p>
          <ErrorText message={error} />
          {error && (
            <p>
              ขอให้แฟนส่งลิงก์ใหม่ หรือ{" "}
              <LinkButton href="/couple" variant="secondary">
                กลับหน้าคู่ของฉัน
              </LinkButton>
            </p>
          )}
          <Button onClick={handleAccept} disabled={busy}>
            {busy ? "กำลังจับคู่..." : "ยอมรับคำเชิญ"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">ไม่พบรหัสคำเชิญในลิงก์ — ขอลิงก์ใหม่จากแฟนอีกครั้ง</p>
          <Link href="/couple" className="text-sm text-love hover:underline">
            ไปหน้าจับคู่
          </Link>
        </>
      )}
    </Card>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="mx-auto max-w-md">
      <Suspense fallback={<Skeleton />}>
        <AcceptForm />
      </Suspense>
    </div>
  );
}
