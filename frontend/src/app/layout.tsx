import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LOVE PASS — คูปองรักสำหรับสองเรา",
  description: "มอบคูปองของขวัญให้แฟนได้ง่าย ๆ พร้อมระบบขอใช้และยืนยัน",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-rose-50/40 text-gray-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
