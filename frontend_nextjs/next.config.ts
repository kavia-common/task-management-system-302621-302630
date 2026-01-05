import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * We ship this UI as a pure static export (SPA).
   *
   * IMPORTANT:
   * Do NOT disable filesystem routes. The App Router relies on filesystem routing
   * (`src/app/page.tsx` => `/`). Setting `useFileSystemPublicRoutes: false` can cause
   * Next to behave as if no routes exist, leading the preview to always show the
   * 404 / not-found UI.
   */
  output: "export",
};

export default nextConfig;
