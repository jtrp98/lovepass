import Link from "next/link";
import { Card } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-semibold text-love">
            <span aria-hidden="true" className="brand-heart">♡</span> LOVE PASS
          </Link>
        </div>
        <Card variant="letter" className="p-6">{children}</Card>
      </div>
    </main>
  );
}
