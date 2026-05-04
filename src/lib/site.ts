/**
 * Resolve the canonical site URL.
 * In production Vercel injects VERCEL_URL automatically.
 * In dev we fall back to NEXT_PUBLIC_SITE_URL or localhost.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const APP_NAME = "Crucible";
export const APP_DESCRIPTION =
  "Plan, prioritize, and track the habits that matter most.";
