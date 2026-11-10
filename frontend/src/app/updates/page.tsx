import Link from "next/link";
import { LuArrowLeft, LuSparkles } from "react-icons/lu";
import { Card } from "@/components/ui";
import { CHANGELOG } from "@/config/changelog";
import { APP_VERSION } from "@/lib/version";

export const metadata = {
  title: "บันทึกการอัปเดต — LOVE PASS",
  description: "บันทึกการเดินทางและการพัฒนาฟีเจอร์ต่าง ๆ ของ LOVE PASS สำหรับคู่รัก",
};

export default function UpdatesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-5 py-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex min-h-12 items-center font-display text-xl font-semibold text-love">
          ♡ LOVE PASS
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center gap-1.5 text-sm text-muted hover:text-love focus-visible:outline-none"
        >
          <LuArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>กลับหน้าแรก</span>
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="pocket-mono rounded-md bg-love-soft px-2.5 py-1 text-sm font-bold text-love">
            v{APP_VERSION}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-success-paper px-2.5 py-0.5 text-xs font-semibold text-success-ink">
            <LuSparkles className="h-3 w-3" aria-hidden="true" /> เวอร์ชันปัจจุบัน
          </span>
        </div>
        <h1 className="text-3xl leading-relaxed sm:text-4xl">บันทึกการเดินทางของ LOVE PASS</h1>
        <p className="text-muted leading-relaxed">
          ทุกความเปลี่ยนแปลงสร้างขึ้นด้วยความตั้งใจ เพื่อให้ทุกตั๋วและของขวัญระหว่างคุณกับแฟนมีความหมายและใช้งานได้อย่างอบอุ่น
        </p>
      </header>

      <div className="space-y-6">
        {CHANGELOG.map((entry) => {
          const isCurrent = entry.version === APP_VERSION;
          return (
            <article key={entry.version} aria-labelledby={`release-${entry.version}`}>
              <Card variant="journal" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="pocket-mono rounded-md bg-love-soft px-2.5 py-0.5 text-sm font-bold text-love">
                      v{entry.version}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-success-paper px-2 py-0.5 text-xs font-semibold text-success-ink">
                        ล่าสุด
                      </span>
                    )}
                  </div>
                  <time className="text-xs text-muted">{entry.date}</time>
                </div>

                <h2 id={`release-${entry.version}`} className="font-display text-lg font-semibold text-ink">
                  {entry.title}
                </h2>

                <div className="space-y-3 pt-1">
                  {entry.sections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-1.5">
                      <p className="text-sm font-semibold text-love">{section.title}</p>
                      <ul className="list-inside list-disc space-y-1 text-sm text-ink leading-relaxed">
                        {section.items.map((item, iIdx) => (
                          <li key={iIdx} className="text-muted">
                            <span className="text-ink">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            </article>
          );
        })}
      </div>

      <footer className="border-t border-line pt-6 text-center text-xs text-muted">
        LOVE PASS v{APP_VERSION} · สร้างด้วยความรักสำหรับสองเรา
      </footer>
    </main>
  );
}
