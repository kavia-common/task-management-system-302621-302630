"use client";

import React, { useEffect, useId, useRef, useState } from "react";

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const descriptionId = useId();

  // Small exit animation (keeps DOM for a moment)
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
    } else if (rendered) {
      setClosing(true);
      const t = window.setTimeout(() => {
        setRendered(false);
        setClosing(false);
      }, 160);
      return () => window.clearTimeout(t);
    }
  }, [open, rendered]);

  useEffect(() => {
    if (!open) return;

    const prev = document.activeElement as HTMLElement | null;
    document.body.setAttribute("data-modal-open", "true");

    // Focus the panel for accessibility
    window.setTimeout(() => panelRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.removeAttribute("data-modal-open");
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!rendered) return null;

  return (
    <div
      className={[
        "fixed inset-0 z-50 grid place-items-center p-4",
        "bg-black/40",
        !closing ? "tm-animate-in" : "opacity-0 transition-opacity duration-150",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-describedby={description ? descriptionId : undefined}
      onMouseDown={(e) => {
        // Close only if clicking the backdrop.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          "tm-surface tm-shadow w-[min(92vw,560px)] p-4 sm:p-5 focus:outline-none",
          !closing ? "tm-animate-pop" : "scale-[0.99] opacity-0 transition duration-150",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{title}</h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm text-[var(--tm-muted)]"
              >
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-[var(--tm-muted)] hover:bg-black/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="pt-4">{children}</div>

        {footer ? (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-black/10 pt-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
