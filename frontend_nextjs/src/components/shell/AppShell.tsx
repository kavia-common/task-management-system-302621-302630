"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

type ActiveRoute = "tasks";

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
  return (
    <div className="min-h-screen bg-[var(--tm-bg)]">
      <header className="border-b border-black/10 bg-white">
        <div className="tm-container flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--tm-primary)] to-[var(--tm-accent)] text-white shadow-sm">
              TM
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Task Manager</p>
              <p className="text-xs text-[var(--tm-muted)]">
                Simple tasks, fast updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authStatus.loading ? (
              <span className="text-sm text-[var(--tm-muted)]">Loading…</span>
            ) : authStatus.isAuthenticated ? (
              <>
                <span className="hidden text-sm text-[var(--tm-muted)] sm:inline">
                  Signed in as{" "}
                  <span className="font-medium text-[var(--tm-text)]">
                    {authStatus.email ?? "user"}
                  </span>
                </span>
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

      <div className="tm-container grid grid-cols-1 gap-4 py-6 md:grid-cols-[240px_1fr]">
        <aside className="tm-surface tm-shadow h-fit p-3">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--tm-muted)]">
            Navigation
          </p>

          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className={[
                "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                activeRoute === "tasks"
                  ? "bg-[color:var(--tm-primary)] text-white"
                  : "text-[var(--tm-text)] hover:bg-black/5",
              ].join(" ")}
              aria-current={activeRoute === "tasks" ? "page" : undefined}
            >
              <span>Tasks</span>
              <span
                className={[
                  "rounded-lg px-2 py-0.5 text-xs",
                  activeRoute === "tasks"
                    ? "bg-white/20 text-white"
                    : "bg-black/5 text-[var(--tm-muted)]",
                ].join(" ")}
              >
                CRUD
              </span>
            </button>
          </nav>

          <div className="mt-4 rounded-xl bg-gradient-to-br from-[rgba(59,130,246,0.12)] to-[rgba(6,182,212,0.10)] p-3">
            <p className="text-sm font-semibold">Tips</p>
            <p className="mt-1 text-sm text-[var(--tm-muted)]">
              Optimistic updates are enabled. If you see a concurrency warning,
              hit refresh to sync with the latest server state.
            </p>
          </div>
        </aside>

        <main className="tm-surface tm-shadow p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3">
            <h1 className="text-lg font-semibold">{title}</h1>
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
