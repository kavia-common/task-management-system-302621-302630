"use client";

import React from "react";

export function Input({
  label,
  hint,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string | null;
  className?: string;
}) {
  const autoId = React.useId();
  const id = props.id ?? autoId;

  return (
    <label className="block">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {hint ? (
          <span className="text-xs text-[var(--tm-muted)]">{hint}</span>
        ) : null}
      </div>

      <input
        {...props}
        id={id}
        className={[
          "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-[var(--tm-text)] shadow-sm transition",
          "border-black/10 focus:outline-none focus:ring-4 focus:ring-[var(--tm-ring)]",
          "disabled:bg-black/[0.02] disabled:text-[rgba(17,24,39,0.75)] disabled:cursor-not-allowed",
          error ? "border-[var(--tm-danger)]" : "",
          className ?? "",
        ].join(" ")}
      />

      {error ? (
        <span className="mt-1 block text-sm text-[var(--tm-danger)]">{error}</span>
      ) : null}
    </label>
  );
}
