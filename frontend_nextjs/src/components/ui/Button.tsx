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

  const cls = (() => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition select-none";
    const focus =
      "focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]";
    const disabledCls = "disabled:opacity-60 disabled:cursor-not-allowed";
    const motion =
      "active:scale-[0.99] hover:-translate-y-[0.5px] hover:shadow-sm";

    if (variant === "primary") {
      return [
        base,
        focus,
        disabledCls,
        motion,
        "bg-[var(--tm-primary)] text-white shadow-sm",
        "hover:opacity-95",
      ].join(" ");
    }
    if (variant === "danger") {
      return [
        base,
        focus,
        disabledCls,
        motion,
        "bg-[var(--tm-danger)] text-white shadow-sm",
        "hover:opacity-95",
      ].join(" ");
    }
    if (variant === "ghost") {
      return [
        base,
        focus,
        disabledCls,
        "bg-transparent text-[var(--tm-text)]",
        "hover:bg-black/5",
      ].join(" ");
    }
    return [
      base,
      focus,
      disabledCls,
      motion,
      "bg-black/[0.04] text-[var(--tm-text)] border border-black/10",
      "hover:bg-black/[0.06]",
    ].join(" ");
  })();

  return (
    <button
      {...props}
      className={[cls, className ?? ""].join(" ")}
      disabled={isDisabled}
    >
      {loading ? <Spinner size="sm" label="Loading" /> : null}
      <span>{children}</span>
    </button>
  );
}
