import Link from "next/link";

export default function NotFound() {
  return (
    <main className="tm-container py-10">
      <section
        className="tm-surface tm-shadow mx-auto max-w-xl p-6"
        role="alert"
        aria-live="assertive"
      >
        <h1 className="text-xl font-semibold">404 – Page Not Found</h1>
        <p className="mt-2 text-sm text-[var(--tm-muted)]">
          The page you’re looking for doesn’t exist. If you followed a link, it
          may be outdated.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--tm-primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
