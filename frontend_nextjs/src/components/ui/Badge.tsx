"use client";

import React from "react";

type Tone = "neutral" | "primary" | "success" | "danger" | "muted";

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold";

  const toneCls =
    tone === "primary"
      ? "border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.10)] text-[var(--tm-primary)]"
      : tone === "success"
      ? "border-[rgba(6,182,212,0.25)] bg-[rgba(6,182,212,0.10)] text-[var(--tm-accent)]"
      : tone === "danger"
      ? "border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.10)] text-[var(--tm-danger)]"
      : tone === "muted"
      ? "border-black/10 bg-black/[0.03] text-[var(--tm-muted)]"
      : "border-black/10 bg-white text-[var(--tm-text)]";

  return <span className={[base, toneCls, className].join(" ")}>{children}</span>;
}
