"use client";

import { useEffect } from "react";
import Link from "next/link";

// PUBLIC_INTERFACE
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  /**
   * App Router error boundary.
   *
   * Next.js uses this component to render errors that occur during rendering
   * within this route segment. It must be a Client Component and provide a
   * "reset" handler for recovery attempts.
   */
  useEffect(() => {
    // Keep logging minimal but useful for debugging. This runs client-side only.
    // eslint-disable-next-line no-console
    console.error("App error boundary caught an error:", error);
  }, [error]);

  return (
    <main className="tm-container py-10">
      <section
        className="tm-surface tm-shadow mx-auto max-w-xl p-6"
        role="alert"
        aria-live="assertive"
      >
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--tm-muted)]">
          An unexpected error occurred while rendering this page. You can try
          again, or return to the home screen.
        </p>

        <div className="mt-4 rounded-xl border border-[var(--tm-danger)] bg-[rgba(239,68,68,0.08)] p-3 text-sm">
          <p className="font-semibold text-[var(--tm-danger)]">Error</p>
          <p className="mt-1 break-words text-[var(--tm-text)]">
            {error?.message || "Unknown error"}
          </p>
          {error?.digest ? (
            <p className="mt-2 text-xs text-[var(--tm-muted)]">
              Digest: <span className="font-mono">{error.digest}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--tm-primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]"
          >
            Try again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-[var(--tm-text)] hover:bg-black/5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
