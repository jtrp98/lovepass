"use client";

import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div className="space-y-4">
        <p className="text-5xl">💝</p>
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">LOVE PASS</h1>
        <p className="max-w-md text-gray-600">
          มอบคูปองของขวัญให้แฟน ตั้งจำนวนและวันหมดอายุเอง แล้วให้แฟนกดขอใช้เมื่อพร้อม
        </p>
      </div>

      <div className="flex gap-3">
        <Link href="/login">
          <Button size="md" className="px-6 py-2.5 text-base">
            เข้าสู่ระบบ
          </Button>
        </Link>
        <Link href="/register">
          <Button variant="secondary" size="md" className="px-6 py-2.5 text-base">
            สมัครสมาชิก
          </Button>
        </Link>
      </div>
    </main>
  );
}
