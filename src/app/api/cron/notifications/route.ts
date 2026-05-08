/**
 * Notification cron endpoint. Vercel Cron hits this every ~15 minutes
 * (see vercel.json). Bearer-auth gated by CRON_SECRET so random
 * internet traffic can't trigger pushes.
 *
 * Vercel's cron delivers a special header automatically:
 *   Authorization: Bearer ${CRON_SECRET}
 * — when CRON_SECRET is configured in env. We accept the same header
 * format from manual curl calls for testing.
 */
import { NextResponse } from "next/server";
import { runNotificationsTick } from "@/lib/push/cron";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Generous max — we iterate every active fast and call web-push for
// each subscription. Default 10s is too tight if you have many users.
export const maxDuration = 60;

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = await runNotificationsTick();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("cron tick error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Cron failed.",
      },
      { status: 500 },
    );
  }
}
