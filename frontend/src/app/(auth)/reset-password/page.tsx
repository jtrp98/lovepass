"use client";

import { Button, ErrorText, Field, LinkButton, Skeleton, Notice, PasswordInput } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [done, setDone] = useState(false);
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setError(null);
    setSubmitting(true);
    try {
      await api.auth.resetPassword(email, token, newPassword);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.errors) setFieldErrors(err.fieldMessages);
      setError(err instanceof ApiError ? err.displayMessage : "ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (done)
    return (
      <div className="space-y-4">
        <Notice>ตั้งรหัสผ่านใหม่แล้ว เข้าสู่ระบบด้วยรหัสใหม่ได้เลย</Notice>
        <LinkButton href="/login">เข้าสู่ระบบ</LinkButton>
      </div>
    );
  if (!email || !token)
    return (
      <div className="space-y-4">
        <h1 className="text-xl">ลิงก์ตั้งรหัสผ่านไม่ครบ</h1>
        <p>ขอลิงก์ใหม่แล้วเปิดจากอีเมลอีกครั้ง</p>
        <LinkButton href="/forgot-password">ขอลิงก์ใหม่</LinkButton>
        <LinkButton href="/login" variant="secondary">
          กลับเข้าสู่ระบบ
        </LinkButton>
      </div>
    );
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-semibold">ตั้งรหัสผ่านใหม่</h1>
      <p className="text-sm text-muted">สำหรับ {email}</p>

      <Field label="รหัสผ่านใหม่ (8 ตัวอักษรขึ้นไป)" error={fieldErrors.newpassword?.[0]}>
        <PasswordInput
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
      </Field>

      <ErrorText message={error} />
      {error && (
        <LinkButton href="/forgot-password" variant="secondary">
          ขอลิงก์ใหม่
        </LinkButton>
      )}

      <Button type="submit" disabled={submitting || !email || !token} className="w-full">
        {submitting ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
      </Button>

      {!email || !token ? (
        <p className="text-center text-sm text-muted">เปิดหน้านี้ผ่านลิงก์ในอีเมลเท่านั้น</p>
      ) : null}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
