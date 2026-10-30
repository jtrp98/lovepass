"use client";
import { LinkButton } from "@/components/ui";
import { TicketDemo } from "@/components/ticket-demo";
import { DashboardPreview } from "@/components/dashboard-preview";
import { StationeryIcon } from "@/components/stationery";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { user, ready } = useAuth(),
    router = useRouter();
  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);
  return (
    <main className="mx-auto grid w-full max-w-5xl items-start gap-10 px-5 py-12 md:grid-cols-2 md:py-20">
      <div className="space-y-6">
        <p className="font-display text-xl font-semibold text-love">♡ LOVE PASS</p>
        <h1 className="text-3xl leading-relaxed sm:text-4xl">
          ความสุขของสองเรา
          <br />
          เริ่มจากตั๋วใบเล็ก ๆ
        </h1>
        <p className="text-lg text-muted">
          เปลี่ยนคำว่า “เดี๋ยวทำให้” เป็นตั๋วให้แฟนเก็บไว้ อยากใช้เมื่อไหร่ก็ฉีกหางตั๋วขอ แล้วคุณยืนยันให้กัน
        </p>
        <p className="text-muted">รับอีเมลแจ้งเตือนเมื่อได้รับคูปอง มีคำขอใช้คูปอง หรือได้รับผลการยืนยัน</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/register">เริ่มสมุดตั๋วของเรา</LinkButton>
          <LinkButton href="/login" variant="secondary">เข้าสู่ระบบ</LinkButton>
        </div>
      </div>
      <TicketDemo />
      <section aria-labelledby="home-preview-title" className="landing-home md:col-span-2">
        <div className="landing-home-copy">
          <p className="pocket-mono text-muted">AFTER YOU SIGN IN</p>
          <h2 id="home-preview-title" className="text-2xl">เข้ามาแล้วเจอ “บ้านของเรา”</h2>
          <ul>
            <li><StationeryIcon name="letter" />เห็นทันทีว่ามีคำขอรอคุณยืนยันอยู่ไหม</li>
            <li><StationeryIcon name="ticket" />นับตั๋วที่ได้รับ ใช้ไปแล้ว และใกล้หมดอายุ</li>
            <li><StationeryIcon name="gift" />เลือกของขวัญใบใหม่ให้แฟนได้ในไม่กี่แตะ</li>
          </ul>
        </div>
        <DashboardPreview />
      </section>
      <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-control pt-4 text-sm text-muted md:col-span-2">
        <Link href="/privacy" className="inline-flex min-h-12 items-center text-love underline underline-offset-4">
          นโยบายความเป็นส่วนตัว
        </Link>
        <a href="mailto:jaturapat.code@gmail.com" className="inline-flex min-h-12 items-center underline underline-offset-4">
          ติดต่อผู้ดูแล LOVE PASS
        </a>
      </footer>
    </main>
  );
}
