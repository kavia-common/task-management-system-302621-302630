"use client";

import { createContext, useContext } from "react";

export type AuthSession = {
  accessToken: string;
  user: { id: string; email: string };
  // Allow extra fields without breaking.
  [k: string]: unknown;
};

export type AuthStatus = {
  loading: boolean;
  session: AuthSession | null;
};

export const AuthContext = createContext<{
  session: AuthSession | null;
  authLoading: boolean;
  setSession: (s: AuthSession | null) => void;
  login: (email: string, password: string) => Promise<AuthSession>;
  register: (email: string, password: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
} | null>(null);

// PUBLIC_INTERFACE
export function useAuth() {
  /** Access auth session and auth actions (login/register/logout). */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
