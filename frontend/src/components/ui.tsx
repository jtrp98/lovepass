"use client";

import type { Rarity } from "@/types";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-rose-500 text-white hover:bg-rose-600",
    secondary: "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "text-gray-600 hover:bg-gray-100",
  };
  const sizes = { sm: "px-2.5 py-1 text-sm", md: "px-4 py-2 text-sm" };

  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${className}`}
      rows={3}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${className}`}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export const rarityStyles: Record<Rarity, { label: string; badge: string; border: string }> = {
  COMMON: { label: "COMMON", badge: "bg-gray-100 text-gray-600 border-gray-300", border: "border-gray-300" },
  RARE: { label: "RARE", badge: "bg-blue-50 text-blue-700 border-blue-300", border: "border-blue-400" },
  EPIC: { label: "EPIC", badge: "bg-purple-50 text-purple-700 border-purple-300", border: "border-purple-400" },
  LEGENDARY: {
    label: "LEGENDARY",
    badge: "bg-amber-50 text-amber-700 border-amber-400",
    border: "border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.35)]",
  },
};

export function RarityBadge({ rarity }: { rarity: Rarity | string }) {
  const style = rarityStyles[rarity as Rarity] ?? rarityStyles.COMMON;
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${style.badge}`}>
      {style.label}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
      <p className="text-gray-500">{title}</p>
      {hint ? <p className="mt-1 text-sm text-gray-400">{hint}</p> : null}
    </div>
  );
}

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p>;
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

const statAccents: Record<string, string> = {
  rose: "text-rose-600",
  blue: "text-blue-600",
  amber: "text-amber-600",
  purple: "text-purple-600",
  gray: "text-gray-700",
};

export function StatCard({ label, value, accent = "rose" }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-3xl font-bold ${statAccents[accent] ?? statAccents.rose}`}>{value}</span>
    </Card>
  );
}

export function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
