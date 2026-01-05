"use client";

import React from "react";

export type ChipOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

export function ChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: ChipOption<T>[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={["flex flex-wrap items-center gap-2", className].join(" ")}>
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--tm-muted)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-1 rounded-xl border border-black/10 bg-white p-1">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]",
                active
                  ? "bg-[rgba(59,130,246,0.12)] text-[var(--tm-primary)]"
                  : "text-[var(--tm-text)] hover:bg-black/5",
              ].join(" ")}
              aria-pressed={active}
            >
              <span>{opt.label}</span>
              {typeof opt.count === "number" ? (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    active ? "bg-white text-[var(--tm-primary)]" : "bg-black/5 text-[var(--tm-muted)]",
                  ].join(" ")}
                >
                  {opt.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
