"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lbToKg } from "@/lib/units";
import type { WorkoutType } from "./templates";

export type ActionResult =
  | { ok: true; workoutId?: string; setId?: string }
  | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });

async function authedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export interface StartWorkoutInput {
  type: WorkoutType;
  templateSlug?: string;
}

export async function startWorkout(
  input: StartWorkoutInput,
): Promise<ActionResult> {
  const { supabase, user } = await authedClient();

  // Block if there's already an active workout
  const { data: existing } = await supabase
    .from("workouts")
    .select("id")
    .eq("status", "active")
    .is("ended_at", null)
    .limit(1)
    .maybeSingle();
  if (existing) return fail("A workout is already in progress.");

  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      type: input.type,
      template_slug: input.templateSlug ?? null,
      started_at: new Date().toISOString(),
      status: "active",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("startWorkout error:", error);
    return fail(error?.message ?? "Could not start workout.");
  }

  revalidatePath("/", "layout");
  return { ok: true, workoutId: data.id };
}

export interface AddSetInput {
  workoutId: string;
  exerciseSlug: string;
  setNumber: number;
  reps?: number;
  weightLb?: number;
  rpe?: number;
  wasWarmup?: boolean;
}

export async function addSet(input: AddSetInput): Promise<ActionResult> {
  const { supabase, user } = await authedClient();

  if (input.reps != null && (input.reps < 0 || input.reps > 999)) {
    return fail("Reps out of range.");
  }
  if (
    input.weightLb != null &&
    (input.weightLb < 0 || input.weightLb > 2000)
  ) {
    return fail("Weight out of range.");
  }
  if (input.rpe != null && (input.rpe < 1 || input.rpe > 10)) {
    return fail("Difficulty must be 1–10.");
  }

  // Pre-check the workout exists. Without this, a stale workoutId from a
  // cached UI tab (after the workout was deleted/cleared elsewhere) would
  // surface as a raw FK constraint error to the user.
  const { data: workoutRow } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", input.workoutId)
    .maybeSingle();
  if (!workoutRow) {
    return fail(
      "Workout no longer exists. The page will refresh.",
    );
  }

  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      user_id: user.id,
      workout_id: input.workoutId,
      exercise_slug: input.exerciseSlug,
      set_number: input.setNumber,
      reps: input.reps ?? null,
      weight_kg: input.weightLb != null ? lbToKg(input.weightLb) : null,
      rpe: input.rpe ?? null,
      was_warmup: input.wasWarmup ?? false,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("addSet error:", error);
    return fail(error?.message ?? "Could not add set.");
  }

  revalidatePath("/", "layout");
  return { ok: true, setId: data.id };
}

export async function updateSet(
  setId: string,
  fields: { reps?: number; weightLb?: number; rpe?: number },
): Promise<ActionResult> {
  const { supabase } = await authedClient();

  if (fields.reps != null && (fields.reps < 0 || fields.reps > 999)) {
    return fail("Reps out of range.");
  }
  if (
    fields.weightLb != null &&
    (fields.weightLb < 0 || fields.weightLb > 2000)
  ) {
    return fail("Weight out of range.");
  }
  if (fields.rpe != null && (fields.rpe < 1 || fields.rpe > 10)) {
    return fail("Difficulty must be 1–10.");
  }

  const patch: Record<string, number | null> = {};
  if (fields.reps !== undefined) patch.reps = fields.reps;
  if (fields.weightLb !== undefined) patch.weight_kg = lbToKg(fields.weightLb);
  if (fields.rpe !== undefined) patch.rpe = fields.rpe;

  const { error } = await supabase
    .from("workout_sets")
    .update(patch)
    .eq("id", setId);

  if (error) {
    console.error("updateSet error:", error);
    return fail(error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Apply a per-exercise difficulty rating. Writes the same rpe value to
 * every non-warmup set for this exercise within the workout, so any
 * future query can read the rating from any set.
 */
export async function rateExerciseDifficulty(
  workoutId: string,
  exerciseSlug: string,
  rpe: number,
): Promise<ActionResult> {
  const { supabase } = await authedClient();

  if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10) {
    return fail("Difficulty must be 1–10.");
  }

  const { error } = await supabase
    .from("workout_sets")
    .update({ rpe })
    .eq("workout_id", workoutId)
    .eq("exercise_slug", exerciseSlug)
    .eq("was_warmup", false);

  if (error) {
    console.error("rateExerciseDifficulty error:", error);
    return fail(error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteSet(setId: string): Promise<ActionResult> {
  const { supabase } = await authedClient();
  const { error } = await supabase
    .from("workout_sets")
    .delete()
    .eq("id", setId);
  if (error) {
    console.error("deleteSet error:", error);
    return fail(error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function endWorkout(
  workoutId: string,
  notes?: string,
): Promise<ActionResult> {
  const { supabase } = await authedClient();

  const { error } = await supabase
    .from("workouts")
    .update({
      ended_at: new Date().toISOString(),
      status: "completed",
      notes: notes ?? null,
    })
    .eq("id", workoutId);

  if (error) {
    console.error("endWorkout error:", error);
    return fail(error.message);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function abandonWorkout(workoutId: string): Promise<ActionResult> {
  const { supabase } = await authedClient();
  const { error } = await supabase
    .from("workouts")
    .update({
      ended_at: new Date().toISOString(),
      status: "abandoned",
    })
    .eq("id", workoutId);
  if (error) {
    console.error("abandonWorkout error:", error);
    return fail(error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function endAllActiveWorkouts(): Promise<{
  ok: boolean;
  count: number;
  error?: string;
}> {
  const { supabase, user } = await authedClient();
  const { data, error } = await supabase
    .from("workouts")
    .update({
      ended_at: new Date().toISOString(),
      status: "abandoned",
    })
    .eq("user_id", user.id)
    .eq("status", "active")
    .select("id");

  if (error) {
    return { ok: false, count: 0, error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true, count: data?.length ?? 0 };
}

/**
 * Delete a single workout (and cascade its sets via the FK on
 * workout_sets.workout_id). RLS confines the delete to the user's own
 * rows, so no extra ownership check is needed.
 */
export async function deleteWorkout(
  workoutId: string,
): Promise<ActionResult> {
  const { supabase } = await authedClient();
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId);
  if (error) {
    console.error("deleteWorkout error:", error);
    return fail(error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteAllWorkouts(): Promise<{
  ok: boolean;
  count: number;
  error?: string;
}> {
  const { supabase, user } = await authedClient();
  const { data, error } = await supabase
    .from("workouts")
    .delete()
    .eq("user_id", user.id)
    .select("id");

  if (error) return { ok: false, count: 0, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, count: data?.length ?? 0 };
}

/**
 * Update started_at AND ended_at on a finished workout. Used from the
 * post-end summary view. Validates end > start and not in future.
 */
export async function updateWorkoutTimes(
  workoutId: string,
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

  const { error } = await supabase
    .from("workouts")
    .update({
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
    })
    .eq("id", workoutId);

  if (error) {
    console.error("updateWorkoutTimes error:", error);
    return fail(error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Update started_at on the active workout. Doesn't shift any of the
 * existing set timestamps — the user is just correcting when they began.
 */
export async function updateWorkoutStartTime(
  workoutId: string,
  newStartIso: string,
): Promise<ActionResult> {
  const { supabase } = await authedClient();

  const newStart = new Date(newStartIso);
  if (Number.isNaN(newStart.getTime())) return fail("Invalid date.");
  if (newStart.getTime() > Date.now())
    return fail("Start time can't be in the future.");

  const { error } = await supabase
    .from("workouts")
    .update({ started_at: newStart.toISOString() })
    .eq("id", workoutId);

  if (error) {
    console.error("updateWorkoutStartTime error:", error);
    return fail(error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
