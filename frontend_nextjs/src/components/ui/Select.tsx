"use client";

import React from "react";

export function Select({
  label,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  const autoId = React.useId();
  const id = props.id ?? autoId;
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select
        {...props}
        id={id}
        className={[
          "mt-1 w-full rounded-xl border px-3 py-2 text-sm bg-white text-[var(--tm-text)]",
          "border-black/10 focus:outline-none focus:ring-4 focus:ring-[var(--tm-ring)]",
          error ? "border-[var(--tm-danger)]" : "",
        ].join(" ")}
      >
        {children}
      </select>
      {error ? (
        <span className="mt-1 block text-sm text-[var(--tm-danger)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
