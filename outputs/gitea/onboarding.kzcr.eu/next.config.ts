import type { NextConfig } from "next";
import packageJson from "./package.json";
import { normalizeBasePath } from "./lib/basePath";

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? packageJson.version
const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: basePath || undefined,
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
