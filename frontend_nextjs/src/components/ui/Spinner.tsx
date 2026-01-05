"use client";

import React from "react";

export function Spinner({
  size = "md",
  className = "",
  label = "Loading",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}) {
  const dims =
    size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span className={["inline-flex items-center gap-2", className].join(" ")}>
      <span
        className={[
          "inline-block animate-spin rounded-full border-2 border-black/20 border-t-black/60",
          dims,
        ].join(" ")}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
