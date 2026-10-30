"use client";

import { Button, ErrorText, Field, Input } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";
import { StationeryIcon } from "@/components/stationery";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
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
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.errors) setFieldErrors(err.fieldMessages);
      setError(err instanceof ApiError ? err.displayMessage : "ส่งคำขอไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-3 text-center">
        <StationeryIcon name="letter" className="mx-auto h-12 w-12 text-love" />
        <h1 className="text-lg font-semibold" role="status">
          ตรวจสอบอีเมลของคุณ
        </h1>
        <p className="text-sm text-muted">
          หากอีเมลนี้ลงทะเบียนไว้ เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่ {email} ลองดูในจดหมายขยะด้วย
        </p>
        <Button variant="secondary" onClick={() => setSent(false)}>
          แก้ไขอีเมล
        </Button>
        <Link href="/login" className="block text-sm text-love hover:underline">
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-semibold">ลืมรหัสผ่าน</h1>
      <Field label="อีเมลที่ใช้สมัคร" error={fieldErrors.email?.[0]}>
        <Input
          autoComplete="email"
          inputMode="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
        />
      </Field>
      <ErrorText message={error} />
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="hover:text-love">
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
