"use client";

import { GoogleLoginButton, OrDivider } from "@/components/GoogleLoginButton";
import { Button, ErrorText, Field, Input } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, displayName);
      router.push("/couple");
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-bold">สมัครสมาชิก</h1>

      <Field label="ชื่อเล่น / ชื่อที่แฟนเรียก">
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={50} placeholder="เช่น หมูตัวเล็ก" />
      </Field>

      <Field label="อีเมล">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
      </Field>

      <Field label="รหัสผ่าน (8 ตัวอักษรขึ้นไป)">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="••••••••" />
      </Field>

      <ErrorText message={error} />

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </Button>

      <OrDivider />
      <GoogleLoginButton />

      <p className="text-center text-sm text-gray-500">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="text-rose-600 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
