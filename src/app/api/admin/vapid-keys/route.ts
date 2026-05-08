/**
 * One-shot VAPID key generator. TEMPORARY — delete this file once
 * you've copied the keys into Vercel env vars.
 *
 * Self-disables once VAPID_PUBLIC_KEY is set in env, so leaving it
 * around briefly is safe.
 */
import { NextResponse } from "next/server";
import webpush from "web-push";
import { requireUser } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireUser();

  if (process.env.VAPID_PUBLIC_KEY) {
    return NextResponse.json(
      {
        error:
          "VAPID keys already configured. Clear VAPID_PUBLIC_KEY in Vercel env first if you really want to rotate.",
      },
      { status: 409 },
    );
  }

  const keys = webpush.generateVAPIDKeys();
  return NextResponse.json(
    {
      readme:
        "Copy publicKey + privateKey into Vercel env, then delete src/app/api/admin/vapid-keys/route.ts and re-deploy.",
      env: {
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: keys.publicKey,
        VAPID_PUBLIC_KEY: keys.publicKey,
        VAPID_PRIVATE_KEY: keys.privateKey,
        VAPID_SUBJECT:
          "mailto:dylan.thorwaldson@rootfinancialpartners.com (or any contact email)",
      },
    },
    { status: 200 },
  );
}
