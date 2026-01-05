"use client";

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { normalizeApiErrorMessage } from "@/lib/api/errors";
import { useToast } from "@/components/toast/ToastProvider";

export function AuthModal({
  open,
  mode,
  onClose,
  onSwitchMode,
}: {
  open: boolean;
  mode: "login" | "register";
  onClose: () => void;
  onSwitchMode: (m: "login" | "register") => void;
}) {
  const { login, register, authLoading } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === "login" ? "Sign in" : "Create account"),
    [mode]
  );

  const description = useMemo(
    () =>
      mode === "login"
        ? "Use your email and password to access your tasks."
        : "Register with email and password to start managing tasks.",
    [mode]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
      onClose();
    } catch (err) {
      const msg = normalizeApiErrorMessage(err);
      setError(msg);
      toast.error("Authentication failed", msg);
    } finally {
      setSubmitting(false);
    }
  }

  const footer = (
    <>
      <Button
        variant="ghost"
        onClick={() => onSwitchMode(mode === "login" ? "register" : "login")}
        disabled={submitting || authLoading}
      >
        {mode === "login" ? "Need an account?" : "Already have an account?"}
      </Button>
      <Button variant="secondary" onClick={onClose} disabled={submitting || authLoading}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" form="auth-form" loading={submitting || authLoading}>
        {mode === "login" ? "Login" : "Register"}
      </Button>
    </>
  );

  return (
    <Modal open={open} title={title} description={description} onClose={onClose} footer={footer}>
      <form id="auth-form" onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting || authLoading}
          placeholder="you@company.com"
        />

        <Input
          label="Password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting || authLoading}
          placeholder="••••••••"
        />

        {error ? (
          <div
            className="rounded-xl border border-[var(--tm-danger)] bg-[rgba(239,68,68,0.06)] p-3 text-sm"
            role="alert"
          >
            <p className="font-semibold text-[var(--tm-danger)]">Error</p>
            <p className="mt-1 text-[var(--tm-text)]">{error}</p>
          </div>
        ) : null}

        <p className="text-xs text-[var(--tm-muted)]">
          Note: This UI is a static export SPA. Your session is stored locally and resumes after
          refresh/redeploy.
        </p>
      </form>
    </Modal>
  );
}
