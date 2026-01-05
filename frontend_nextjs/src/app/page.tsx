"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { TasksDashboard } from "@/components/tasks/TasksDashboard";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, buildUrl } from "@/lib/api/config";

type ActiveRoute = "tasks";

type ApiConnectivity =
  | { status: "checking" }
  | { status: "ok"; details?: string }
  | { status: "error"; details: string };

export default function Home() {
  const [activeRoute, setActiveRoute] = useState<ActiveRoute>("tasks");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [apiConnectivity, setApiConnectivity] = useState<ApiConnectivity>({
    status: "checking",
  });

  const { session, logout, authLoading } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setApiConnectivity({ status: "checking" });
      try {
        // We don't rely on backend implementing a dedicated health endpoint.
        // A successful CORS-enabled 404 still proves "reachable".
        const res = await fetch(buildUrl("/api/__connectivity_check__"), {
          method: "GET",
          credentials: "include",
        });

        if (cancelled) return;

        if (res.ok) {
          setApiConnectivity({ status: "ok", details: `${res.status} ${res.statusText}` });
          return;
        }

        // Any HTTP response means the backend is reachable.
        setApiConnectivity({
          status: "ok",
          details: `${res.status} ${res.statusText || ""}`.trim(),
        });
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Network error (backend unreachable)";
        setApiConnectivity({
          status: "error",
          details: `Could not reach backend at ${API_BASE}. ${msg}`,
        });
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const pageTitle = useMemo(() => {
    if (activeRoute === "tasks") return "Tasks";
    return "Dashboard";
  }, [activeRoute]);

  const connectivityBanner =
    apiConnectivity.status === "checking" ? (
      <div className="mb-4 rounded-xl border border-black/10 bg-white p-3 text-sm">
        <p className="font-semibold">Connecting to backend…</p>
        <p className="mt-1 text-[var(--tm-muted)]">
          Checking API reachability at <span className="font-mono">{API_BASE}</span>
        </p>
      </div>
    ) : apiConnectivity.status === "error" ? (
      <div
        className="mb-4 rounded-xl border border-[var(--tm-danger)] bg-[rgba(239,68,68,0.08)] p-3 text-sm"
        role="alert"
      >
        <p className="font-semibold text-[var(--tm-danger)]">Backend not reachable</p>
        <p className="mt-1 text-[var(--tm-text)]">{apiConnectivity.details}</p>
        <p className="mt-2 text-[var(--tm-muted)]">
          Ensure the backend is running on port 3001 and that{" "}
          <span className="font-mono">NEXT_PUBLIC_API_BASE</span> is correct.
        </p>
      </div>
    ) : (
      <div className="mb-4 rounded-xl border border-black/10 bg-white p-3 text-sm">
        <p className="font-semibold">Backend reachable</p>
        <p className="mt-1 text-[var(--tm-muted)]">
          API base: <span className="font-mono">{API_BASE}</span>
          {apiConnectivity.details ? (
            <>
              {" "}
              • last check: <span className="font-mono">{apiConnectivity.details}</span>
            </>
          ) : null}
        </p>
      </div>
    );

  return (
    <>
      <AppShell
        title={pageTitle}
        activeRoute={activeRoute}
        onNavigate={(r) => setActiveRoute(r)}
        authStatus={{
          loading: authLoading,
          isAuthenticated: !!session,
          email: session?.user?.email ?? null,
        }}
        onLogin={() => {
          setAuthMode("login");
          setAuthOpen(true);
        }}
        onRegister={() => {
          setAuthMode("register");
          setAuthOpen(true);
        }}
        onLogout={logout}
      >
        {connectivityBanner}

        {activeRoute === "tasks" ? (
          <TasksDashboard
            onRequireAuth={() => {
              setAuthMode("login");
              setAuthOpen(true);
            }}
          />
        ) : null}
      </AppShell>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSwitchMode={(m) => setAuthMode(m)}
      />
    </>
  );
}
