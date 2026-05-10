import packageJson from "../../package.json";

export const dynamic = "force-dynamic";

export function GET() {
  const version = process.env.APP_VERSION?.trim() || packageJson.version;

  return new Response(version, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
