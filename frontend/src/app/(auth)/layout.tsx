import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-semibold text-love">
            💝 LOVE PASS
          </Link>
        </div>
        <div className="rounded-2xl border border-control bg-white p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
