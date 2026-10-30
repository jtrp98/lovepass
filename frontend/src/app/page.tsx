"use client";
import { LinkButton } from "@/components/ui";
import { LoveTicket, type LoveTicketData } from "@/components/love-ticket";
import { TicketDemo } from "@/components/ticket-demo";
import { DashboardPreview } from "@/components/dashboard-preview";
import { StationeryIcon } from "@/components/stationery";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Real ticket components in each state and rarity colour; opening one only invites sign-up.
const showcase: { caption: string; ticket: LoveTicketData }[] = [
  {
    caption: "มอบให้แฟน เก็บไว้ใช้วันไหนก็ได้",
    ticket: { id: "LP-0021", name: "ทริปเล็ก ๆ วันหยุด", note: "ขับรถไปทะเลด้วยกันสักวันนะ", terms: "ทริปไปกลับภายในวันเดียว วางแผนเส้นทางด้วยกัน", rarity: "LEGENDARY", category: "ADVENTURE", state: "available", quantity: 1, expiresAt: "2027-01-31T16:59:59Z", from: "เจ", to: "เธอคนโปรด" },
  },
  {
    caption: "แฟนฉีกขอใช้ คุณได้อีเมลแจ้ง",
    ticket: { id: "LP-0022", name: "มื้อพิเศษสำหรับสองเรา", note: "ร้านไหนก็ได้ที่เธออยากไป เราเลี้ยงเอง", terms: "เลือกร้านและวันที่สะดวกด้วยกัน 1 มื้อ", rarity: "RARE", category: "FOOD", state: "pending", quantity: 0, reserved: 1, expiresAt: "2026-12-14T16:59:59Z", from: "เจ", to: "เธอคนโปรด" },
  },
  {
    caption: "ยืนยันแล้ว เก็บเป็นความทรงจำ",
    ticket: { id: "LP-0023", name: "ตั๋วขอพร 1 ข้อ", note: "ขอมาได้หนึ่งอย่าง เราจะตั้งใจฟังเลย", terms: "คูปอง 1 ใบ ขอพรได้ 1 ข้อ", rarity: "EPIC", category: "WISH", state: "used", quantity: 0, expiresAt: "2026-11-29T16:59:59Z", redeemedAt: "2026-10-14T12:00:00Z", from: "เจ", to: "เธอคนโปรด" },
  },
];

export default function LandingPage() {
  const [openId, setOpenId] = useState<string | null>(null);
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
          <LinkButton href="/register">เริ่มสมุดตั๋วของเรา</LinkButton>
        </div>
        <DashboardPreview />
      </section>
      <section aria-labelledby="showcase-title" className="landing-showcase md:col-span-2">
        <p className="pocket-mono text-muted">FROM OUR LITTLE BOOK</p>
        <h2 id="showcase-title" className="text-2xl">ตั๋วหนึ่งใบ เดินทางแบบนี้</h2>
        <ol className="landing-showcase-list">
          {showcase.map(({ caption, ticket }, index) => (
            <li key={ticket.id}>
              <p className="landing-showcase-caption"><span aria-hidden="true">{index + 1}</span>{caption}</p>
              <LoveTicket ticket={ticket} open={openId === ticket.id} onOpen={() => setOpenId(ticket.id)} onClose={() => setOpenId(null)}>
                <p className="pocket-terms">นี่คือตั๋วตัวอย่าง เริ่มสมุดของคุณเพื่อเลือกคูปองให้คนพิเศษ</p>
                <LinkButton href="/register">เริ่มสมุดตั๋วของเรา</LinkButton>
              </LoveTicket>
            </li>
          ))}
        </ol>
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
