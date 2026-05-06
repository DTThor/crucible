"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProtocol, type ProtocolSlug } from "./protocols";

/**
 * Mutation server actions.
 *
 * Design principles after several rounds of debugging stale-state issues:
 *  - Be tolerant of inconsistent rows. Don't reject updates because the
 *    current state isn't what we expected — just normalize toward correct.
 *  - Always return a concrete error string when a write fails, so the
 *    caller can show it. No silent no-ops.
 *  - revalidatePath after every mutation so server caches drop.
 */

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type CountResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });
const ok = (): ActionResult => ({ ok: true });

async function authedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function startFast(
  protocolSlug: ProtocolSlug,
): Promise<ActionResult> {
  const { supabase, user } = await authedClient();

  // Strict definition of "in progress": status='active' AND ended_at IS NULL.
  const { data: existing } = await supabase
    .from("fasts")
    .select("id")
    .eq("status", "active")
    .is("ended_at", null)
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
    return fail(error.message ?? "Could not start fast.");
  }

  revalidatePath("/", "layout");
  return ok();
}

/**
 * End a fast. Tolerant: if the fast already has ended_at set, it's a no-op
 * success (we don't overwrite the original end time). If status was inconsistent
 * (e.g. 'active' but ended_at set, or vice versa), this normalizes it.
 */
export async function stopFast(
  fastId: string,
  reason: "completed" | "broken_early" = "completed",
): Promise<ActionResult> {
  const { supabase } = await authedClient();

  const { data: existing, error: fetchError } = await supabase
    .from("fasts")
    .select("id, ended_at, status")
    .eq("id", fastId)
    .maybeSingle();
  if (fetchError) {
    console.error("stopFast fetch error:", fetchError);
    return fail(fetchError.message);
  }
  if (!existing) return fail("Fast not found.");

  // Normalize: ensure ended_at is set (preserve existing if already there)
  // and status reflects the final outcome.
  const finalEndedAt = existing.ended_at ?? new Date().toISOString();
  const finalStatus =
    existing.ended_at && existing.status !== "active" ? existing.status : reason;

  const { error } = await supabase
    .from("fasts")
    .update({ ended_at: finalEndedAt, status: finalStatus })
    .eq("id", fastId);

  if (error) {
    console.error("stopFast error:", error);
    return fail(error.message);
  }

  revalidatePath("/", "layout");
  return ok();
}

/** Update started_at on the active fast. Recomputes planned_end_at. */
export async function updateFastStartTime(
  fastId: string,
  newStartTimeISO: string,
): Promise<ActionResult> {
  const { supabase } = await authedClient();

  const newStart = new Date(newStartTimeISO);
  if (Number.isNaN(newStart.getTime())) return fail("Invalid start time.");
  if (newStart.getTime() > Date.now()) {
    return fail("Start time can't be in the future.");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("fasts")
    .select("protocol_slug")
    .eq("id", fastId)
    .maybeSingle();
  if (fetchError) return fail(fetchError.message);
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
    .eq("id", fastId);

  if (error) {
    console.error("updateFastStartTime error:", error);
    return fail(error.message);
  }

  revalidatePath("/", "layout");
  return ok();
}

/** Permanently delete a fast. */
export async function deleteFast(fastId: string): Promise<ActionResult> {
  const { supabase } = await authedClient();

  const { error } = await supabase
    .from("fasts")
    .delete()
    .eq("id", fastId);

  if (error) {
    console.error("deleteFast error:", error);
    return fail(error.message);
  }

  revalidatePath("/", "layout");
  return ok();
}

/**
 * Update both started_at and ended_at on a fast (typically used from the
 * post-end summary screen). If the fast was still active and we're setting
 * ended_at, we also normalize status.
 */
export async function updateFastTimes(
  fastId: string,
  startedAtIso: string,
  endedAtIso: string,
): Promise<ActionResult> {
  const { supabase } = await authedClient();

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

  const { data: existing } = await supabase
    .from("fasts")
    .select("status, protocol_slug")
    .eq("id", fastId)
    .maybeSingle();
  if (!existing) return fail("Fast not found.");

  // If the fast was somehow still 'active' when we're editing times, set a
  // sensible final status based on whether it hit its target.
  let finalStatus: string = existing.status;
  if (existing.status === "active") {
    const protocol = getProtocol(existing.protocol_slug as ProtocolSlug);
    const durationHours = (end.getTime() - start.getTime()) / 3_600_000;
    finalStatus = durationHours >= protocol.targetHours
      ? "completed"
      : "broken_early";
  }

  const { error } = await supabase
    .from("fasts")
    .update({
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
      status: finalStatus,
    })
    .eq("id", fastId);

  if (error) {
    console.error("updateFastTimes error:", error);
    return fail(error.message);
  }

  revalidatePath("/", "layout");
  return ok();
}

/**
 * Force-end every fast still in 'active' status. Returns the number of
 * rows updated so the caller can verify the action actually did something.
 */
export async function endAllActiveFasts(): Promise<CountResult> {
  const { supabase, user } = await authedClient();

  const { data, error } = await supabase
    .from("fasts")
    .update({ ended_at: new Date().toISOString(), status: "broken_early" })
    .eq("user_id", user.id)
    .eq("status", "active")
    .select("id");

  if (error) {
    console.error("endAllActiveFasts error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, count: data?.length ?? 0 };
}

/**
 * NUCLEAR — delete every fast for the current user. Returns the number
 * of rows deleted so the caller can verify the action actually ran.
 */
export async function deleteAllFasts(): Promise<CountResult> {
  const { supabase, user } = await authedClient();

  const { data, error } = await supabase
    .from("fasts")
    .delete()
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("deleteAllFasts error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, count: data?.length ?? 0 };
}

export async function changeActiveFastProtocol(
  fastId: string,
  protocolSlug: ProtocolSlug,
): Promise<ActionResult> {
  const { supabase } = await authedClient();

  const { data: existing } = await supabase
    .from("fasts")
    .select("started_at")
    .eq("id", fastId)
    .maybeSingle();
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
    .eq("id", fastId);

  if (error) {
    console.error("changeActiveFastProtocol error:", error);
    return fail(error.message);
  }

  revalidatePath("/", "layout");
  return ok();
}
