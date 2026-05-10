/**
 * Normalizes the optional Next.js base path so `/` behaves like root and
 * subpaths are always stored in `/segment` format without a trailing slash.
 */
export function normalizeBasePath(basePath?: string | null): string {
  const trimmedBasePath = basePath?.trim();

  if (!trimmedBasePath || trimmedBasePath === "/") {
    return "";
  }

  const segments = trimmedBasePath.split("/").filter(Boolean);

  return segments.length > 0 ? `/${segments.join("/")}` : "";
}

/**
 * Utility function to get the base path for the application
 * This ensures consistent base path handling across the app
 */
export function getBasePath(): string {
  return normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);
}

/**
 * Utility function to create asset paths with the base path
 * @param assetPath - The asset path relative to /public (e.g., '/logo.png')
 * @returns The full path including base path (e.g., '/onboarding/logo.png')
 */
export function getAssetPath(assetPath: string): string {
  const basePath = getBasePath();
  // Ensure assetPath starts with /
  const normalizedAssetPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${basePath}${normalizedAssetPath}`;
}
