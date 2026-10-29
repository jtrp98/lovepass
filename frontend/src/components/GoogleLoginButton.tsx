"use client";

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
    if (document.querySelector(`script[src="${GOOGLE_GSI_SRC}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GOOGLE_GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("โหลด Google Sign-In ไม่สำเร็จ"));
    document.head.appendChild(script);
  });
}

/**
 * ปุ่ม "Sign in with Google" — ถ้าไม่ได้ตั้ง NEXT_PUBLIC_GOOGLE_CLIENT_ID จะไม่ render
 * เข้าสำเร็จแล้ว redirect ไป /dashboard (reload เพื่อให้ AuthProvider โหลด session ใหม่)
 */
export function GoogleLoginButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return;

    let cancelled = false;

    void (async () => {
      try {
        await loadGsiScript();
        if (cancelled) return;

        const google = (window as WindowWithGoogle).google;
        if (!google || !buttonRef.current) return;

        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              await api.auth.google(response.credential);
              window.location.assign("/dashboard");
            } catch (err) {
              setError(err instanceof ApiError ? err.displayMessage : "เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
            }
          },
        });

        google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
          locale: "th",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "โหลด Google Sign-In ไม่สำเร็จ");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="space-y-2 text-center">
      <div ref={buttonRef} className="flex justify-center" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

/** เส้นคั่น "หรือ" ใช้คู่กับปุ่ม Google */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-gray-400">
      <span className="h-px flex-1 bg-gray-200" />
      หรือ
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}
