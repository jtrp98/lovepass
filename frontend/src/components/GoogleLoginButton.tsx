"use client";

import { Button, ErrorText } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { authDestination } from "@/lib/flow";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";

// --- โครงสร้าง minimal ของ Google Identity Services (เฉพาะที่ใช้) ---
interface GsiIdApi {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    auto_select?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
}

interface WindowWithGoogle extends Window {
  google?: { accounts: { id: GsiIdApi } };
}

const GOOGLE_GSI_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as WindowWithGoogle).google?.accounts.id) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_GSI_SRC}"]`);
    const script = existing ?? document.createElement("script");
    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error("โหลด Google นานเกินไป กรุณาลองอีกครั้ง"));
    }, 15000);
    script.addEventListener(
      "load",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => {
        clearTimeout(timeout);
        script.remove();
        reject(new Error("โหลด Google Sign-In ไม่สำเร็จ"));
      },
      { once: true },
    );
    if (existing) return;
    script.src = GOOGLE_GSI_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

/**
 * ปุ่ม "Sign in with Google" — ถ้าไม่ได้ตั้ง NEXT_PUBLIC_GOOGLE_CLIENT_ID จะไม่ render
 * คืนผู้ใช้ไปยังปลายทางภายในที่ตรวจแล้วหลังโหลด session สำเร็จ
 */
export function GoogleLoginButton() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return;

    let cancelled = false;
    let observer: ResizeObserver | undefined;
    setError(null);
    setLoaded(false);

    void (async () => {
      try {
        await loadGsiScript();
        if (cancelled) return;

        const google = (window as WindowWithGoogle).google;
        if (!google || !buttonRef.current) return;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (busyRef.current) return;
            busyRef.current = true;
            setBusy(true);
            setError(null);
            try {
              await api.auth.google(response.credential);
              await refreshUser();
              router.push(authDestination());
            } catch (err) {
              setError(err instanceof ApiError ? err.displayMessage : "เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
            } finally {
              busyRef.current = false;
              setBusy(false);
            }
          },
        });

        let previousWidth = 0;
        const renderButton = () => {
          const container = buttonRef.current;
          if (!container || cancelled) return;
          const width = Math.floor(Math.min(400, container.clientWidth));
          if (width === previousWidth) return;
          previousWidth = width;
          container.replaceChildren();
          google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width,
            text: "continue_with",
            locale: "th",
          });
        };
        renderButton();
        observer = new ResizeObserver(renderButton);
        observer.observe(buttonRef.current);
        setLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "โหลด Google Sign-In ไม่สำเร็จ");
      }
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [attempt, refreshUser, router]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="space-y-2 text-center">
      <div aria-busy={busy} className="min-h-12">
        <div
          ref={buttonRef}
          className={
            busy ? "pointer-events-none flex w-full justify-center opacity-60" : "flex w-full justify-center"
          }
        />
        {busy || (!loaded && !error) ? (
          <p role="status">{busy ? "กำลังเข้าสู่ระบบ…" : "กำลังโหลด Google…"}</p>
        ) : null}
      </div>
      <ErrorText message={error} />
      {error && (
        <Button type="button" variant="secondary" onClick={() => setAttempt((a) => a + 1)}>
          ลอง Google อีกครั้ง
        </Button>
      )}
    </div>
  );
}

/** เส้นคั่น "หรือ" ใช้คู่กับปุ่ม Google */
export function OrDivider() {
  if (!GOOGLE_CLIENT_ID) return null;
  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <span className="h-px flex-1 bg-canvas" />
      หรือ
      <span className="h-px flex-1 bg-canvas" />
    </div>
  );
}
