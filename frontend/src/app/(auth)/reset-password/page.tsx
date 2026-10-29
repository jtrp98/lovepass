"use client";

import { Button, ErrorText, Field, Input } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.auth.resetPassword(email, token, newPassword);
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-bold">ตั้งรหัสผ่านใหม่</h1>
      <p className="text-sm text-gray-500">สำหรับ {email}</p>

      <Field label="รหัสผ่านใหม่ (8 ตัวอักษรขึ้นไป)">
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
      </Field>

      <ErrorText message={error} />

      <Button type="submit" disabled={submitting || !email || !token} className="w-full">
        {submitting ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
      </Button>

      {!email || !token ? (
        <p className="text-center text-sm text-gray-500">เปิดหน้านี้ผ่านลิงก์ในอีเมลเท่านั้น</p>
      ) : null}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
