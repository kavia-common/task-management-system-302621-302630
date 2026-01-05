"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { TasksDashboard } from "@/components/tasks/TasksDashboard";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";

type ActiveRoute = "tasks";

export default function Home() {
  const [activeRoute, setActiveRoute] = useState<ActiveRoute>("tasks");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const { session, logout, authLoading } = useAuth();

  const pageTitle = useMemo(() => {
    if (activeRoute === "tasks") return "Tasks";
    return "Dashboard";
  }, [activeRoute]);

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
