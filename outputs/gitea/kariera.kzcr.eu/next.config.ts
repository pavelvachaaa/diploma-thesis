import type { NextConfig } from "next";
import { normalizeBasePath } from "./lib/paths";

const umamiProxyTarget = process.env.UMAMI_PROXY_TARGET?.replace(/\/$/, "");
const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH) || undefined;

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  basePath,
  async rewrites() {
    if (!umamiProxyTarget) {
      return [];
    }

    return [
      {
        source: "/kz.js",
        destination: `${umamiProxyTarget}/kz.js`,
      },
      {
        source: "/api/kz",
        destination: `${umamiProxyTarget}/api/kz`,
      },
    ];
  },
};

export default nextConfig;
