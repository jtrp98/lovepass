"use client";

import { GoogleLoginButton, OrDivider } from "@/components/GoogleLoginButton";
import { Button, ErrorText, Field, Input, PasswordInput } from "@/components/ui";
import { authDestination, authLink } from "@/lib/flow";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [destination, setDestination] = useState("/couple");
  useEffect(() => {
    setDestination(authDestination("/couple"));
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
      await register(email, password, displayName);
      router.push(destination);
    } catch (err) {
      if (err instanceof ApiError && err.errors) setFieldErrors(err.fieldMessages);
      setError(err instanceof ApiError ? err.displayMessage : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-xl font-semibold">สมัครสมาชิก</h1>

      <Field label="ชื่อเล่น / ชื่อที่แฟนเรียก" error={fieldErrors.displayname?.[0]}>
        <Input
          autoComplete="nickname"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          maxLength={50}
          placeholder="เช่น หมูตัวเล็ก"
        />
      </Field>

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

      <Field
        label="รหัสผ่าน (8 ตัวอักษรขึ้นไป)"
        error={fieldErrors.password?.[0]}
        hint="อย่างน้อย 8 ตัวอักษร มีตัวพิมพ์เล็ก (a-z) และตัวเลข"
      >
        <PasswordInput
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="••••••••"
        />
      </Field>

      <ErrorText message={error} />

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </Button>

      <OrDivider />
      <GoogleLoginButton />

      <p className="text-center text-sm text-muted">
        มีบัญชีแล้ว?{" "}
        <Link href={authLink("/login", destination)} className="text-love hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
