"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProtocol, type ProtocolSlug } from "./protocols";

/**
 * Mutation server actions. RLS enforces the authenticated user.
 * All return after revalidating Today + Fast paths so the UI updates.
 */

export async function startFast(protocolSlug: ProtocolSlug) {
  const supabase = await createClient();

  // Confirm we have a user (defense in depth — middleware should have already checked)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Reject if there's already an active fast — UI shouldn't let this happen,
  // but a stale tab could.
  const { data: existing } = await supabase
    .from("fasts")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (existing) {
    return { error: "A fast is already in progress." as const };
  }

  const protocol = getProtocol(protocolSlug);
  const now = new Date();
  const plannedEnd = new Date(now.getTime() + protocol.targetHours * 3_600_000);

  const { error } = await supabase.from("fasts").insert({
    user_id: user.id,
    protocol_slug: protocolSlug,
    started_at: now.toISOString(),
    planned_end_at: plannedEnd.toISOString(),
    status: "active",
  });

  if (error) {
    console.error("startFast error:", error);
    return { error: "Could not start fast. Try again." as const };
  }

  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function stopFast(
  fastId: string,
  reason: "completed" | "broken_early" = "completed",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("fasts")
    .update({
      ended_at: new Date().toISOString(),
      status: reason,
    })
    .eq("id", fastId)
    .eq("status", "active");

  if (error) {
    console.error("stopFast error:", error);
    return { error: "Could not stop fast." as const };
  }

  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function changeActiveFastProtocol(
  fastId: string,
  protocolSlug: ProtocolSlug,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Recompute plannedEnd from started_at + new target so the ring stays accurate.
  const { data: existing } = await supabase
    .from("fasts")
    .select("started_at")
    .eq("id", fastId)
    .single();
  if (!existing) return { error: "Fast not found." as const };

  const protocol = getProtocol(protocolSlug);
  const newPlannedEnd = new Date(
    new Date(existing.started_at).getTime() + protocol.targetHours * 3_600_000,
  );

  const { error } = await supabase
    .from("fasts")
    .update({
      protocol_slug: protocolSlug,
      planned_end_at: newPlannedEnd.toISOString(),
    })
    .eq("id", fastId)
    .eq("status", "active");

  if (error) {
    console.error("changeActiveFastProtocol error:", error);
    return { error: "Could not change protocol." as const };
  }

  revalidatePath("/", "layout");
  return { ok: true as const };
}
