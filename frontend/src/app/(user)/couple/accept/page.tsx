"use client";

import { Button, Card, ErrorText } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function AcceptForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
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
    <Card className="space-y-4 text-center">
      <p className="text-4xl">💞</p>
      <h1 className="text-lg font-bold">ยอมรับคำเชิญจับคู่</h1>
      {token ? (
        <>
          <p className="text-sm text-gray-600">กดปุ่มด้านล่างเพื่อจับคู่กับคนที่ส่งคำเชิญนี้</p>
          <ErrorText message={error} />
          <Button onClick={handleAccept} disabled={busy}>
            {busy ? "กำลังจับคู่..." : "ยอมรับคำเชิญ"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600">ไม่พบโทเคนในลิงก์ — ขอลิงก์ใหม่จากแฟนอีกครั้ง</p>
          <Link href="/couple" className="text-sm text-rose-600 hover:underline">
            ไปหน้าจับคู่
          </Link>
        </>
      )}
    </Card>
  );
}

export default function AcceptInvitationPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="mx-auto max-w-md">
      {mounted ? (
        <Suspense>
          <AcceptForm />
        </Suspense>
      ) : null}
    </div>
  );
}
