import Script from "next/script";
import { getAssetPath } from "@/lib/paths";

const umamiEnabled = process.env.NEXT_PUBLIC_UMAMI_ENABLED === "true";
const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
const domains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS?.trim();

export function UmamiScript() {
  if (!umamiEnabled || !websiteId) {
    return null;
  }

  return (
    <Script
      src={getAssetPath("/kz.js")}
      strategy="afterInteractive"
      data-website-id={websiteId}
      data-domains={domains || undefined}
    />
  );
}
