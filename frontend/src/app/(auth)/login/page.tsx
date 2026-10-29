"use client";

import { GoogleLoginButton, OrDivider } from "@/components/GoogleLoginButton";
import { Button, ErrorText, Field, Input } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.displayMessage : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-bold">เข้าสู่ระบบ</h1>

      <Field label="อีเมล">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
      </Field>

      <Field label="รหัสผ่าน">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
      </Field>

      <ErrorText message={error} />

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </Button>

      <OrDivider />
      <GoogleLoginButton />

      <div className="flex justify-between text-sm text-gray-500">
        <Link href="/forgot-password" className="hover:text-rose-600">
          ลืมรหัสผ่าน?
        </Link>
        <Link href="/register" className="hover:text-rose-600">
          สมัครสมาชิก
        </Link>
      </div>
    </form>
  );
}
