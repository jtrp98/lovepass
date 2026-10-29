"use client";

import { api, tokenStore } from "@/lib/api";
import type { CurrentUser } from "@/types";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface AuthContextValue {
  user: CurrentUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tokenStore.access) {
      setReady(true);
      return;
    }

    api.auth
      .me()
      .then(setUser)
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

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
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

/** บังคับให้ login ก่อนเข้าหน้า — ใช้ใน (user)/layout.tsx */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

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
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
    if (ready && user && !user.isAdmin) router.replace("/dashboard");
  }, [ready, user, router]);

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
      className={`inline-block size-6 animate-spin rounded-full border-2 border-rose-400 border-t-transparent ${className}`}
      role="status"
      aria-label="loading"
    />
  );
}
