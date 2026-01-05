"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
};

type ToastApi = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = React.useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = uid();
      setToasts((ts) => [...ts, { id, kind, title, description }]);
      // Auto-dismiss after 6s.
      window.setTimeout(() => remove(id), 6000);
    },
    [remove]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, d) => push("success", t, d),
      error: (t, d) => push("error", t, d),
      info: (t, d) => push("info", t, d),
      remove,
    }),
    [push, remove]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed right-4 top-4 z-[60] flex w-[min(92vw,420px)] flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="tm-surface tm-shadow-sm px-4 py-3"
            role="status"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "inline-block h-2.5 w-2.5 rounded-full",
                      t.kind === "success"
                        ? "bg-[var(--tm-accent)]"
                        : t.kind === "error"
                        ? "bg-[var(--tm-danger)]"
                        : "bg-[var(--tm-primary)]",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                  <p className="truncate text-sm font-semibold">{t.title}</p>
                </div>
                {t.description ? (
                  <p className="mt-1 text-sm text-[var(--tm-muted)]">{t.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-[var(--tm-muted)] hover:bg-black/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]"
                onClick={() => api.remove(t.id)}
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useToast(): ToastApi {
  /** Toast API for showing success/error/info messages. */
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
