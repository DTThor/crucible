"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProtocol, type ProtocolSlug } from "./protocols";

/**
 * Discriminated union so TS narrows `if (!res.ok) ...` properly on the client.
 */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });
const ok = (): ActionResult => ({ ok: true });

export async function startFast(
  protocolSlug: ProtocolSlug,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("fasts")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (existing) return fail("A fast is already in progress.");

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
    return fail("Could not start fast. Try again.");
  }

  revalidatePath("/", "layout");
  return ok();
}

export async function stopFast(
  fastId: string,
  reason: "completed" | "broken_early" = "completed",
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("fasts")
    .update({ ended_at: new Date().toISOString(), status: reason })
    .eq("id", fastId)
    .eq("status", "active");

  if (error) {
    console.error("stopFast error:", error);
    return fail("Could not stop fast.");
  }

  revalidatePath("/", "layout");
  return ok();
}

export async function updateFastStartTime(
  fastId: string,
  newStartTimeISO: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const newStart = new Date(newStartTimeISO);
  if (Number.isNaN(newStart.getTime())) return fail("Invalid start time.");
  if (newStart.getTime() > Date.now()) {
    return fail("Start time can't be in the future.");
  }

  // Recompute planned_end_at from new start + current protocol's target.
  const { data: existing } = await supabase
    .from("fasts")
    .select("protocol_slug")
    .eq("id", fastId)
    .single();
  if (!existing) return fail("Fast not found.");

  const protocol = getProtocol(existing.protocol_slug as ProtocolSlug);
  const newPlannedEnd = new Date(
    newStart.getTime() + protocol.targetHours * 3_600_000,
  );

  const { error } = await supabase
    .from("fasts")
    .update({
      started_at: newStart.toISOString(),
      planned_end_at: newPlannedEnd.toISOString(),
    })
    .eq("id", fastId)
    .eq("status", "active");

  if (error) {
    console.error("updateFastStartTime error:", error);
    return fail("Could not update start time.");
  }

  revalidatePath("/", "layout");
  return ok();
}

/**
 * Permanently delete a fast. Used for cleaning up test/erroneous entries.
 * RLS limits this to fasts owned by the authed user. We `.select()` to
 * surface RLS / not-found cases instead of silently no-op'ing.
 */
export async function deleteFast(fastId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("fasts")
    .delete()
    .eq("id", fastId)
    .select("id");

  if (error) {
    console.error("deleteFast error:", error);
    return fail("Could not delete fast.");
  }
  if (!data || data.length === 0) {
    return fail("Fast not found.");
  }

  revalidatePath("/", "layout");
  return ok();
}

/**
 * Update both start_at and ended_at on a completed fast.
 * - end must be after start
 * - end can't be in the future
 * - if status is 'active', use updateFastStartTime / stopFast instead
 */
export async function updateFastTimes(
  fastId: string,
  startedAtIso: string,
  endedAtIso: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const start = new Date(startedAtIso);
  const end = new Date(endedAtIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return fail("Invalid date.");
  }
  if (end.getTime() <= start.getTime()) {
    return fail("End time must be after start.");
  }
  if (end.getTime() > Date.now()) {
    return fail("End time can't be in the future.");
  }

  const { data, error } = await supabase
    .from("fasts")
    .update({
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
    })
    .eq("id", fastId)
    .select("id");

  if (error) {
    console.error("updateFastTimes error:", error);
    return fail("Could not update times.");
  }
  if (!data || data.length === 0) {
    return fail("Fast not found.");
  }

  revalidatePath("/", "layout");
  return ok();
}

/**
 * Force-end every fast currently in 'active' status for the user.
 * Defensive cleanup for orphan fasts left from earlier testing or crashes.
 */
export async function endAllActiveFasts(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("fasts")
    .update({ ended_at: new Date().toISOString(), status: "broken_early" })
    .eq("status", "active");

  if (error) {
    console.error("endAllActiveFasts error:", error);
    return fail("Could not end active fasts.");
  }

  revalidatePath("/", "layout");
  return ok();
}

export async function changeActiveFastProtocol(
  fastId: string,
  protocolSlug: ProtocolSlug,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("fasts")
    .select("started_at")
    .eq("id", fastId)
    .single();
  if (!existing) return fail("Fast not found.");

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
    return fail("Could not change protocol.");
  }

  revalidatePath("/", "layout");
  return ok();
}
