"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendPush, type PushTarget } from "./server";

type ActionResult = { ok: true } | { ok: false; error: string };
const fail = (error: string): ActionResult => ({ ok: false, error });

async function authedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

/**
 * Upsert a push subscription for the current user. Idempotent on
 * (user_id, endpoint) — re-subscribing replaces the keys + bumps
 * updated_at.
 */
export async function subscribePush(
  input: PushSubscriptionInput,
): Promise<ActionResult> {
  if (!input.endpoint || !input.p256dh || !input.auth) {
    return fail("Invalid subscription.");
  }
  const { supabase, user } = await authedClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent ?? null,
    },
    { onConflict: "user_id,endpoint" },
  );
  if (error) {
    console.error("subscribePush error:", error);
    return fail(error.message);
  }
  return { ok: true };
}

/** Drop the subscription for this endpoint. */
export async function unsubscribePush(
  endpoint: string,
): Promise<ActionResult> {
  if (!endpoint) return fail("Missing endpoint.");
  const { supabase } = await authedClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) {
    console.error("unsubscribePush error:", error);
    return fail(error.message);
  }
  return { ok: true };
}

/**
 * Send a hello-world push to every subscription belonging to the
 * caller. Used by the "Send test push" button on the Me tab so we
 * can verify the plumbing end-to-end without waiting for the cron
 * job to fire.
 */
export async function sendTestPush(): Promise<
  ActionResult & { delivered?: number }
> {
  const { supabase, user } = await authedClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (error) {
    return fail(error.message);
  }
  const subs = (data ?? []) as PushTarget[];
  if (subs.length === 0) {
    return fail("No subscriptions found. Toggle notifications on first.");
  }

  let delivered = 0;
  const expiredEndpoints: string[] = [];

  for (const sub of subs) {
    const result = await sendPush(sub, {
      title: "Crucible test push",
      body: "Notifications are working. You're set.",
      url: "/me",
      tag: "test",
    });
    if (result === "ok") delivered++;
    if (result === "expired") expiredEndpoints.push(sub.endpoint);
  }

  // Clean up dead endpoints so the next test isn't slowed down.
  if (expiredEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  if (delivered === 0) {
    return fail(
      "Couldn't deliver to any subscription. Try toggling notifications off and back on.",
    );
  }
  return { ok: true, delivered };
}
