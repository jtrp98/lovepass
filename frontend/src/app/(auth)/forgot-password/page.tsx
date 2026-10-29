"use client";

import { Button, ErrorText, Field, Input } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "ส่งคำขอไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-3xl">📧</p>
        <h1 className="text-lg font-bold">ตรวจสอบอีเมลของคุณ</h1>
        <p className="text-sm text-gray-600">
          หากอีเมลนี้ลงทะเบียนไว้ ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้ (ถ้าไม่ได้ตั้งค่า Resend ใน backend
          อีเมลจะถูกข้ามและปรากฏใน log ของ API)
        </p>
        <Link href="/login" className="block text-sm text-rose-600 hover:underline">
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-bold">ลืมรหัสผ่าน</h1>
      <Field label="อีเมลที่ใช้สมัคร">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
      </Field>
      <ErrorText message={error} />
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
      </Button>
      <p className="text-center text-sm text-gray-500">
        <Link href="/login" className="hover:text-rose-600">
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
