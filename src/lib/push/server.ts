/**
 * Server-only helper around the `web-push` package. Centralizes VAPID
 * key plumbing so server actions and the cron job can share one
 * `sendPush` function.
 *
 * Required env vars:
 *   VAPID_PUBLIC_KEY        — also exposed to the client as
 *                             NEXT_PUBLIC_VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY       — server-only secret
 *   VAPID_SUBJECT           — `mailto:you@example.com` (RFC requires
 *                             a contact for the push service)
 */
import "server-only";
import webpush from "web-push";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "Missing VAPID env vars (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT)",
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Deep-link URL the notification opens on tap (e.g. "/fast"). */
  url?: string;
  /** Tag to dedupe identical-kind pushes. */
  tag?: string;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Send a push to a single subscription. Returns:
 *   - "ok"        — accepted by the push service
 *   - "expired"   — endpoint is dead (404/410); caller should delete
 *                   the row
 *   - "error"     — transient or unexpected; caller should log and
 *                   try again next cycle
 */
export async function sendPush(
  target: PushTarget,
  payload: PushPayload,
): Promise<"ok" | "expired" | "error"> {
  configure();
  try {
    await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 }, // 24h — drop if the device is offline that long
    );
    return "ok";
  } catch (err: unknown) {
    const code =
      typeof err === "object" && err !== null && "statusCode" in err
        ? Number((err as { statusCode: unknown }).statusCode)
        : 0;
    if (code === 404 || code === 410) return "expired";
    console.error("sendPush error:", err);
    return "error";
  }
}
