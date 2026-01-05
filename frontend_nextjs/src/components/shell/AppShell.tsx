"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type ActiveRoute = "tasks";

function initials(email: string | null) {
  if (!email) return "U";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/g).filter(Boolean);
  const chars =
    parts.length >= 2
      ? `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`
      : `${email[0] ?? "U"}${email[1] ?? ""}`;
  return chars.toUpperCase();
}

export function AppShell({
  title,
  activeRoute,
  onNavigate,
  authStatus,
  onLogin,
  onRegister,
  onLogout,
  children,
}: {
  title: string;
  activeRoute: ActiveRoute;
  onNavigate: (r: ActiveRoute) => void;
  authStatus: { loading: boolean; isAuthenticated: boolean; email: string | null };
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const userInitials = useMemo(() => initials(authStatus.email), [authStatus.email]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onDocMouseDown = (e: MouseEvent) => {
      const el = menuRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setMenuOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-[var(--tm-bg)]">
      <header className="border-b border-black/10 bg-white">
        <div className="tm-container flex h-14 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="flex min-w-0 items-center gap-3 rounded-lg px-1 py-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]"
              aria-label="Go to Tasks"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--tm-primary)] text-sm font-semibold text-white">
                TM
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">Task Manager</span>
                <span className="block truncate text-xs text-[var(--tm-muted)]">
                  {activeRoute === "tasks" ? "Tasks" : title}
                </span>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {authStatus.loading ? (
              <span className="text-sm text-[var(--tm-muted)]">Loading…</span>
            ) : authStatus.isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-2.5 py-2 text-sm font-semibold",
                    "hover:bg-black/[0.02]",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]",
                  ].join(" ")}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-black/[0.04] text-xs font-bold text-[var(--tm-text)]">
                    {userInitials}
                  </span>
                  <span className="hidden max-w-[220px] truncate sm:inline">
                    {authStatus.email ?? "Signed in"}
                  </span>
                  <span className="text-[var(--tm-muted)]" aria-hidden="true">
                    ▾
                  </span>
                </button>

                {menuOpen ? (
                  <div
                    className="absolute right-0 mt-2 w-[min(92vw,320px)] rounded-xl border border-black/10 bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
                    role="menu"
                    aria-label="User menu"
                  >
                    <div className="px-2 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tm-muted)]">
                        Signed in as
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[var(--tm-text)]">
                        {authStatus.email ?? "user"}
                      </p>
                    </div>
                    <div className="my-2 h-px bg-black/10" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className={[
                        "w-full rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-[var(--tm-text)]",
                        "hover:bg-black/5",
                        "focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]",
                      ].join(" ")}
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Button variant="secondary" onClick={onLogin}>
                  Login
                </Button>
                <Button variant="primary" onClick={onRegister}>
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="tm-container py-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-4">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-[var(--tm-muted)]">
              A simple, focused workspace for your tasks.
            </p>
          </div>

          <div className="tm-surface tm-shadow-sm p-4 sm:p-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
