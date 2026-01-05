"use client";

import React from "react";

// PUBLIC_INTERFACE
export function Skeleton({
  className = "",
  rounded = "xl",
}: {
  /** Tailwind className to control width/height (e.g. "h-4 w-32"). */
  className?: string;
  rounded?: "md" | "lg" | "xl";
}) {
  /** Simple skeleton shimmer block (pure client-side, export-safe). */
  const r =
    rounded === "md"
      ? "rounded-md"
      : rounded === "lg"
      ? "rounded-lg"
      : "rounded-xl";

  return <div className={["tm-skeleton", r, className].join(" ")} />;
}
