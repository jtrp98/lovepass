"use client";

import Link from "next/link";
import type { Rarity } from "@/types";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ComponentProps,
  type CSSProperties,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
const variants = {
  primary: "bg-love text-white hover:bg-love-hover",
  secondary: "border border-control bg-love-soft text-love hover:bg-canvas",
  danger: "bg-danger text-white hover:bg-danger-hover",
  ghost: "text-muted hover:bg-canvas",
};
function buttonStyle(variant: Variant, className: string) {
  return `inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl px-4 py-2 text-base font-semibold transition-[color,background-color,transform] motion-safe:active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`;
}
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  return <button data-size={size} className={buttonStyle(variant, className)} {...props} />;
}
export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonStyle(variant, className)} {...props} />;
}
const controlStyle =
  "min-h-12 w-full min-w-0 rounded-xl border border-control bg-surface px-3 py-2 text-base text-ink disabled:bg-canvas";
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlStyle} ${className}`} {...props} />;
}
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <span className="block space-y-1">
      <Input {...props} type={show ? "text" : "password"} />
      <button
        type="button"
        className="min-h-12 text-sm text-love"
        aria-pressed={show}
        onClick={() => setShow(!show)}
      >
        {show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
      </button>
    </span>
  );
}
export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} className={`${controlStyle} ${className}`} {...props} />;
}
export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${controlStyle} ${className}`} {...props} />;
}
export function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<InputHTMLAttributes<HTMLInputElement>>, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? id + "-error" : hint ? id + "-hint" : undefined,
      })
    : children;
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="block text-base font-semibold text-ink">
        {label}
      </label>
      {control}
      {hint && (
        <p id={id + "-hint"} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && <ErrorText id={id + "-error"} message={error} />}
    </div>
  );
}
export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`min-w-0 rounded-2xl border border-love-soft bg-surface p-5 text-ink shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
export const rarityStyles: Record<Rarity, { label: string; badge: string; border: string; color: string }> = {
  COMMON: {
    label: "อบอุ่น · COMMON",
    badge: "bg-mint-soft text-mint-ink",
    border: "border-control",
    color: "var(--color-mint-soft)",
  },
  RARE: {
    label: "พิเศษ · RARE",
    badge: "bg-sky-soft text-sky-ink",
    border: "border-control",
    color: "var(--color-sky-soft)",
  },
  EPIC: {
    label: "สุดพิเศษ · EPIC",
    badge: "bg-lavender-soft text-lavender-ink",
    border: "border-control",
    color: "var(--color-lavender-soft)",
  },
  LEGENDARY: {
    label: "ล้ำค่า · LEGENDARY",
    badge: "bg-butter-soft text-butter-ink",
    border: "border-control",
    color: "var(--color-butter-soft)",
  },
};
export function CouponCard({
  rarity = "COMMON",
  className = "",
  children,
}: {
  rarity?: Rarity;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      style={{ "--ticket-color": rarityStyles[rarity].color } as CSSProperties}
      className={`coupon-ticket min-w-0 rounded-2xl border border-love-soft bg-surface p-5 text-ink shadow-sm ${className}`}
    >
      {children}
    </article>
  );
}
export function RarityBadge({ rarity }: { rarity: Rarity | string }) {
  const style = rarityStyles[rarity as Rarity] ?? rarityStyles.COMMON;
  return (
    <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${style.badge}`}>
      {style.label}
    </span>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    PENDING: "รอยืนยัน",
    APPROVED: "ใช้แล้ว",
    REJECTED: "ปฏิเสธแล้ว",
    CANCELLED: "ยกเลิกแล้ว",
    ACTIVE: "เปิดให้เลือก",
    INACTIVE: "ซ่อนไว้",
  };
  const style =
    status === "PENDING"
      ? "bg-butter-soft text-butter-ink"
      : ["APPROVED", "ACTIVE"].includes(status)
        ? "bg-mint-soft text-mint-ink"
        : status === "REJECTED"
          ? "bg-danger-soft text-danger"
          : "bg-canvas text-muted";
  return (
    <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${style}`}>
      {labels[status] ?? status}
    </span>
  );
}
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-control p-6 text-center">
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {action}
    </div>
  );
}
export function ErrorText({ message, id }: { message?: string | null; id?: string }) {
  return message ? (
    <p id={id} role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
      {message}
    </p>
  ) : null;
}
export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="space-y-3">
      <ErrorText message={message} />
      <Button variant="secondary" onClick={retry}>
        ลองอีกครั้ง
      </Button>
    </div>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-xl bg-mint-soft px-3 py-2 text-mint-ink">
      ✓ {children}
    </p>
  );
}
export function Skeleton() {
  return (
    <div role="status" aria-label="กำลังโหลดข้อมูล" className="space-y-3">
      <span className="sr-only">กำลังโหลดข้อมูล</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 rounded-2xl bg-love-soft motion-safe:animate-pulse" />
      ))}
    </div>
  );
}
export function Dialog({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const dialog = ref.current!,
      previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    dialog.querySelector<HTMLElement>("h2")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
      else
        Array.from(document.querySelectorAll<HTMLElement>("main h1"))
          .find((heading) => heading.getClientRects().length)
          ?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0],
          last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          event.currentTarget.querySelector<HTMLElement>("h2")?.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === event.currentTarget.querySelector("h2"))
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      aria-labelledby={titleId}
      aria-busy={busy}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl bg-surface p-5 text-ink shadow-xl backdrop:bg-black/40"
    >
      <h2 id={titleId} tabIndex={-1} className="mb-4 text-xl">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
      {busy && (
        <p role="status" className="mt-3 text-sm text-muted">
          กำลังดำเนินการ กรุณารอสักครู่ก่อนปิด
        </p>
      )}
    </dialog>
  );
}
export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 tabIndex={-1} className="text-2xl text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-base text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
const statAccents: Record<string, string> = {
  rose: "text-love",
  blue: "text-sky-ink",
  amber: "text-butter-ink",
  purple: "text-lavender-ink",
  gray: "text-muted",
};
export function StatCard({
  label,
  value,
  accent = "rose",
}: {
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-2xl font-semibold ${statAccents[accent]}`}>{value}</span>
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
