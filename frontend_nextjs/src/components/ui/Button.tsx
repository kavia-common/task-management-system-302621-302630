"use client";

import React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  variant = "secondary",
  loading = false,
  disabled,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
}) {
  const isDisabled = !!disabled || loading;

  const cls = (() => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)] disabled:opacity-60 disabled:cursor-not-allowed";
    if (variant === "primary") {
      return `${base} bg-[var(--tm-primary)] text-white hover:opacity-95`;
    }
    if (variant === "danger") {
      return `${base} bg-[var(--tm-danger)] text-white hover:opacity-95`;
    }
    if (variant === "ghost") {
      return `${base} bg-transparent text-[var(--tm-text)] hover:bg-black/5`;
    }
    return `${base} bg-black/5 text-[var(--tm-text)] hover:bg-black/10`;
  })();

  return (
    <button {...props} className={cls} disabled={isDisabled}>
      {loading ? (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/60"
          aria-hidden="true"
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
