import type { Viewport } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";
import "./vouchers.css";
import "./pocket.css";

const sarabun = localFont({
  variable: "--font-sarabun",
  src: [
    { path: "./fonts/sarabun-400.woff2", weight: "400" },
    { path: "./fonts/sarabun-600.woff2", weight: "600" },
  ],
  display: "swap",
});
const mali = localFont({
  variable: "--font-mali",
  src: "./fonts/mali-600.woff2",
  weight: "600",
  display: "swap",
  preload: false,
});

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata = {
  title: "LOVE PASS — คูปองรักสำหรับสองเรา",
  description: "มอบคูปองของขวัญให้แฟนได้ง่าย ๆ พร้อมระบบขอใช้และยืนยัน",
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${sarabun.variable} ${mali.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
