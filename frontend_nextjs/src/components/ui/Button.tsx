"use client";

import React from "react";
import { Spinner } from "@/components/ui/Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  variant = "secondary",
  loading = false,
  disabled,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  className?: string;
}) {
  const isDisabled = !!disabled || loading;

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold";
  const focus = "focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]";
  const disabledCls = "disabled:opacity-60 disabled:cursor-not-allowed";
  const common = [base, focus, disabledCls].join(" ");

  const cls =
    variant === "primary"
      ? [common, "bg-[var(--tm-primary)] text-white hover:opacity-95"].join(" ")
      : variant === "danger"
      ? [common, "bg-[var(--tm-danger)] text-white hover:opacity-95"].join(" ")
      : variant === "ghost"
      ? [common, "bg-transparent text-[var(--tm-text)] hover:bg-black/5"].join(" ")
      : [
          common,
          "border border-black/10 bg-white text-[var(--tm-text)] hover:bg-black/[0.02]",
        ].join(" ");

  return (
    <button
      {...props}
      className={[cls, className ?? ""].join(" ")}
      disabled={isDisabled}
      aria-busy={loading || undefined}
    >
      {loading ? <Spinner size="sm" label="Loading" /> : null}
      <span>{children}</span>
    </button>
  );
}
