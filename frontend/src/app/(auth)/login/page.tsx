"use client";

import { GoogleLoginButton, OrDivider } from "@/components/GoogleLoginButton";
import { Button, ErrorText, Field, Input, PasswordInput } from "@/components/ui";
import { authDestination, authLink } from "@/lib/flow";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [destination, setDestination] = useState("/dashboard");
  useEffect(() => {
    setDestination(authDestination("/dashboard"));
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await login(email, password);
      router.push(destination);
    } catch (err) {
      if (err instanceof ApiError && err.errors) setFieldErrors(err.fieldMessages);
      setError(err instanceof ApiError ? err.displayMessage : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-semibold">เข้าสู่ระบบ</h1>

      <Field label="อีเมล" error={fieldErrors.email?.[0]}>
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

      <Field label="รหัสผ่าน" error={fieldErrors.password?.[0]}>
        <PasswordInput
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </Field>

      <ErrorText message={error} />

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </Button>

      <OrDivider />
      <GoogleLoginButton />

      <div className="flex justify-between text-sm text-muted">
        <Link href="/forgot-password" className="hover:text-love">
          ลืมรหัสผ่าน?
        </Link>
        <Link href={authLink("/register", destination)} className="hover:text-love">
          สมัครสมาชิก
        </Link>
      </div>
    </form>
  );
}
