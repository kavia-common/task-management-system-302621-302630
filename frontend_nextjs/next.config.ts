import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  /**
   * Static export + App Router:
   * We use `app/not-found.tsx` for 404 handling. Disabling `useFileSystemPublicRoutes`
   * prevents Next from attempting to additionally generate legacy Pages Router
   * fallbacks like `/404`, which can trigger prerender/export issues in some setups.
   */
  useFileSystemPublicRoutes: false,
};

export default nextConfig;
