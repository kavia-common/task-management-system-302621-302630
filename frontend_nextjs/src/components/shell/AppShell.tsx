"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type ActiveRoute = "tasks";

function initials(email: string | null) {
  if (!email) return "U";
  const parts = email.split("@")[0]?.split(/[._-]/g).filter(Boolean) ?? [];
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

  return (
    <div className="min-h-screen bg-[var(--tm-bg)]">
      <header className="border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="tm-container flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--tm-primary)] to-[var(--tm-accent)] text-sm font-semibold text-white shadow-sm">
              TM
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Task Manager</p>
              <p className="text-xs text-[var(--tm-muted)]">Simple tasks, fast updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authStatus.loading ? (
              <span className="text-sm text-[var(--tm-muted)]">Loading…</span>
            ) : authStatus.isAuthenticated ? (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white text-xs font-semibold text-[var(--tm-text)] shadow-sm">
                    {userInitials}
                  </div>
                  <div className="leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Signed in</span>
                      <Badge tone="success">active</Badge>
                    </div>
                    <span className="text-xs text-[var(--tm-muted)]">
                      {authStatus.email ?? "user"}
                    </span>
                  </div>
                </div>

                <Button variant="secondary" onClick={onLogout}>
                  Logout
                </Button>
              </>
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

      <div className="tm-container grid grid-cols-1 gap-4 py-6 md:grid-cols-[260px_1fr]">
        <aside className="tm-surface tm-shadow-sm h-fit p-3">
          <div className="flex items-center justify-between px-3 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tm-muted)]">
              Navigation
            </p>
            <span className="text-xs text-[var(--tm-muted)]">v1</span>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className={[
                "group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]",
                activeRoute === "tasks"
                  ? "bg-[rgba(59,130,246,0.12)] text-[var(--tm-primary)]"
                  : "text-[var(--tm-text)] hover:bg-black/5",
              ].join(" ")}
              aria-current={activeRoute === "tasks" ? "page" : undefined}
            >
              <span className="flex items-center gap-2">
                <span
                  className={[
                    "inline-block h-2 w-2 rounded-full",
                    activeRoute === "tasks"
                      ? "bg-[var(--tm-primary)]"
                      : "bg-black/30 group-hover:bg-black/40",
                  ].join(" ")}
                  aria-hidden="true"
                />
                Tasks
              </span>

              <span
                className={[
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  activeRoute === "tasks"
                    ? "bg-white text-[var(--tm-primary)] border border-[rgba(59,130,246,0.25)]"
                    : "bg-black/5 text-[var(--tm-muted)]",
                ].join(" ")}
              >
                CRUD
              </span>
            </button>
          </nav>

          <div className="mt-4 rounded-xl border border-black/10 bg-gradient-to-br from-[rgba(59,130,246,0.10)] to-[rgba(6,182,212,0.08)] p-3">
            <p className="text-sm font-semibold">Tips</p>
            <p className="mt-1 text-sm text-[var(--tm-muted)]">
              Optimistic updates are enabled. If you see a concurrency warning, hit{" "}
              <span className="font-semibold">Refresh</span> to sync with the latest server state.
            </p>
          </div>
        </aside>

        <main className="tm-surface tm-shadow p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="mt-0.5 text-sm text-[var(--tm-muted)]">
                Stay focused. Keep tasks small and actionable.
              </p>
            </div>
            <span className="text-sm text-[var(--tm-muted)]">
              {new Date().toLocaleDateString()}
            </span>
          </div>

          <div className="pt-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
