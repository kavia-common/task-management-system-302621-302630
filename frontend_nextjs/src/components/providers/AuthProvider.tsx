"use client";

import React, { useEffect } from "react";
import { AuthContext, AuthSession, AuthStatus } from "@/hooks/useAuth";
import { authApi } from "@/lib/api/auth";
import { safeJsonParse } from "@/lib/safeJson";
import { useToast } from "@/components/toast/ToastProvider";

const STORAGE_KEY = "tm_session_v1";

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = safeJsonParse<AuthSession>(raw);
  return parsed ?? null;
}

function writeStoredSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [status, setStatus] = React.useState<AuthStatus>(() => ({
    loading: true,
    session: null,
  }));

  useEffect(() => {
    // Load session from localStorage on first mount.
    const stored = readStoredSession();
    setStatus({ loading: false, session: stored });
  }, []);

  useEffect(() => {
    // Sync across tabs.
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = e.newValue ? safeJsonParse<AuthSession>(e.newValue) : null;
      setStatus({ loading: false, session: next });
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const login = React.useCallback(
    async (email: string, password: string) => {
      setStatus((s) => ({ ...s, loading: true }));
      try {
        const session = await authApi.login({ email, password });
        writeStoredSession(session);
        setStatus({ loading: false, session });
        toast.success("Welcome back. You are now logged in.");
        return session;
      } catch (err) {
        setStatus((s) => ({ ...s, loading: false }));
        throw err;
      }
    },
    [toast]
  );

  const register = React.useCallback(
    async (email: string, password: string) => {
      setStatus((s) => ({ ...s, loading: true }));
      try {
        const session = await authApi.register({ email, password });
        writeStoredSession(session);
        setStatus({ loading: false, session });
        toast.success("Account created. You are now logged in.");
        return session;
      } catch (err) {
        setStatus((s) => ({ ...s, loading: false }));
        throw err;
      }
    },
    [toast]
  );

  const logout = React.useCallback(async () => {
    const current = readStoredSession();
    setStatus((s) => ({ ...s, loading: true }));
    try {
      // Best-effort logout; even if backend is down, still clear locally.
      if (current?.accessToken) {
        await authApi.logout({ accessToken: current.accessToken });
      }
    } catch {
      // Keep UX resilient: local logout always works.
    } finally {
      writeStoredSession(null);
      setStatus({ loading: false, session: null });
      toast.info("Logged out.");
    }
  }, [toast]);

  const value = React.useMemo(
    () => ({
      session: status.session,
      authLoading: status.loading,
      setSession: (s: AuthSession | null) => {
        writeStoredSession(s);
        setStatus({ loading: false, session: s });
      },
      login,
      register,
      logout,
    }),
    [status.loading, status.session, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
