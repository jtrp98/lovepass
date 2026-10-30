"use client";
import { Button, Dialog, LinkButton } from "@/components/ui";
import { LoveTicket, TicketDetail, type LoveTicketData } from "@/components/love-ticket";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
const example: LoveTicketData = {
  id: "FOR-YOU", name: "กอดเติมพลัง", note: "เหนื่อยเมื่อไหร่ มารับกอดอุ่น ๆ ได้หนึ่งครั้ง",
  terms: "เลือกเวลาที่เราทั้งคู่สะดวก", rarity: "COMMON", category: "AFFECTION", state: "available",
};
export default function LandingPage() {
  const [showExample, setShowExample] = useState(false);
  const { user, ready } = useAuth(),
    router = useRouter();
  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);
  return (
    <main className="mx-auto grid w-full max-w-5xl items-center gap-10 px-5 py-12 md:grid-cols-2 md:py-20">
      <div className="space-y-6">
        <p className="font-display text-xl font-semibold text-love">♡ LOVE PASS</p>
        <h1 className="text-3xl leading-relaxed sm:text-4xl">
          ความสุขของสองเรา
          <br />
          เริ่มจากตั๋วใบเล็ก ๆ
        </h1>
        <p className="text-lg text-muted">
          เปลี่ยนคำว่า “เดี๋ยวทำให้” เป็นคูปองให้แฟนเก็บไว้ขอใช้ เมื่อพร้อมก็ยืนยันให้กัน
        </p>
        <p className="text-muted">รับอีเมลแจ้งเตือนเมื่อได้รับคูปอง มีคำขอใช้คูปอง หรือได้รับผลการยืนยัน</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/register">เริ่มสมุดตั๋วของเรา</LinkButton>
          <LinkButton href="/login" variant="secondary">
            เข้าสู่ระบบ
          </LinkButton>
        </div>
      </div>
      <section aria-label="ตัวอย่างคูปอง" className="space-y-3">
        <p className="pocket-mono text-muted">A LITTLE PREVIEW / ตัวอย่างคูปอง</p>
        <LoveTicket ticket={example} catalog onOpen={() => setShowExample(true)} />
      </section>
      <ol className="grid gap-4 md:col-span-2 md:grid-cols-3">
        {["เลือกคูปองที่อยากให้", "ส่งให้แฟนพร้อมวันหมดอายุ", "แฟนขอใช้ คุณกดยืนยัน"].map((text, i) => (
          <li key={text} className="rounded-xl bg-mint-soft p-4">
            <span className="mr-2 font-semibold text-mint-ink">{i + 1}.</span>
            {text}
          </li>
        ))}
      </ol>
      <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-control pt-4 text-sm text-muted md:col-span-2">
        <Link href="/privacy" className="inline-flex min-h-12 items-center text-love underline underline-offset-4">
          นโยบายความเป็นส่วนตัว
        </Link>
        <a href="mailto:jaturapat.code@gmail.com" className="inline-flex min-h-12 items-center underline underline-offset-4">
          ติดต่อผู้ดูแล LOVE PASS
        </a>
      </footer>
      {showExample && <Dialog title="ตัวอย่างคูปอง · กอดเติมพลัง" className="ticket-dialog" onClose={() => setShowExample(false)}>
        <TicketDetail ticket={example} />
        <p className="text-sm text-muted">นี่คือตั๋วตัวอย่าง เริ่มสมุดของคุณเพื่อเลือกคูปองให้คนพิเศษ</p>
        <div className="pocket-dialog-actions">
          <Button variant="secondary" onClick={() => setShowExample(false)}>ปิด</Button>
          <LinkButton href="/register">เริ่มสมุดตั๋วของเรา</LinkButton>
        </div>
      </Dialog>}
    </main>
  );
}
