"use client";

import { ApiError, api, tokenStore } from "@/lib/api";
import { ErrorState } from "@/components/ui";
import { authLink } from "@/lib/flow";
import type { CurrentUser } from "@/types";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface AuthContextValue {
  user: CurrentUser | null;
  ready: boolean;
  error: string | null;
  retry: () => void;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const refreshUser = useCallback(async () => {
    setUser(await api.auth.me());
  }, []);
  const retry = useCallback(async () => {
    setError(null);
    setReady(false);
    try {
      if (tokenStore.access) await refreshUser();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        tokenStore.clear();
        setUser(null);
      } else setError("เชื่อมต่อเพื่อเปิดบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setReady(true);
    }
  }, [refreshUser]);
  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("lovepass:session-expired", expire);
    void retry();
    return () => window.removeEventListener("lovepass:session-expired", expire);
  }, [retry]);

  const login = useCallback(async (email: string, password: string) => {
    await api.auth.login(email, password);
    setUser(await api.auth.me());
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    await api.auth.register(email, password, displayName);
    setUser(await api.auth.me());
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, error, retry, refreshUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

/** บังคับให้ login ก่อนเข้าหน้า — ใช้ใน (user)/layout.tsx */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready, error, retry } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user && !error)
      router.replace(authLink("/login", window.location.pathname + window.location.search));
  }, [ready, user, error, router]);

  if (error)
    return (
      <div className="mx-auto max-w-md p-6">
        <ErrorState message={error} retry={retry} />
      </div>
    );

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

/** สำหรับหน้า admin — ต้องเป็น Admin เท่านั้น */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, ready, error, retry } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user && !error)
      router.replace(authLink("/login", window.location.pathname + window.location.search));
    if (ready && user && !user.isAdmin) router.replace("/dashboard");
  }, [ready, user, error, router]);

  if (error)
    return (
      <div className="mx-auto max-w-md p-6">
        <ErrorState message={error} retry={retry} />
      </div>
    );

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user.isAdmin) return null;

  return <>{children}</>;
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-block size-6 animate-spin rounded-full border-2 border-control border-t-transparent ${className}`}
      role="status"
      aria-label="กำลังโหลด"
    />
  );
}
