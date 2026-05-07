import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActiveWorkout {
  id: string;
  type: string;
  template_slug: string | null;
  started_at: string;
  notes: string | null;
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_slug: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  was_warmup: boolean;
  created_at: string;
}

/**
 * The user's currently in-progress workout, or null.
 *
 * Tolerant of multiple active rows (which shouldn't happen but might via
 * race conditions). Returns the most-recently-started one. Avoids
 * `.maybeSingle()` because that errors on N>1 — we'd rather pick a winner
 * than show "no workout" when one exists.
 */
export async function getActiveWorkout(): Promise<ActiveWorkout | null> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workouts")
    .select("id, type, template_slug, started_at, notes")
    .eq("status", "active")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("getActiveWorkout error:", error);
    return null;
  }
  return data?.[0] ?? null;
}

export interface WorkoutById {
  id: string;
  type: string;
  template_slug: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  notes: string | null;
}

/** Fetch a single workout by id (RLS confines to user's own). */
export async function getWorkoutById(
  id: string,
): Promise<WorkoutById | null> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workouts")
    .select("id, type, template_slug, started_at, ended_at, status, notes")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getWorkoutById error:", error);
    return null;
  }
  return data;
}

/** All sets for a workout, ordered by set_number. */
export async function getWorkoutSets(workoutId: string): Promise<WorkoutSet[]> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_sets")
    .select(
      "id, workout_id, exercise_slug, set_number, reps, weight_kg, rpe, was_warmup, created_at",
    )
    .eq("workout_id", workoutId)
    .order("set_number", { ascending: true });

  if (error) {
    console.error("getWorkoutSets error:", error);
    return [];
  }
  return data ?? [];
}

import { kgToLb } from "@/lib/units";
import type { ExerciseHistory } from "@/lib/training/suggestions";

/**
 * Pull the user's most-recent completed set for a given exercise — used
 * by the suggestion algorithm to place sensible placeholders in the
 * inputs next time the user hits this exercise. We require weight_kg +
 * reps (need both to render a placeholder), but rpe is *optional*: if
 * the user logged sets without rating, we still suggest "repeat last
 * session". Rating just makes the suggestion smarter.
 *
 * IMPORTANT: this is also called from inside an active workout, so we
 * must avoid returning the *current* workout's own sets — otherwise the
 * suggestion flips to whatever was just logged. The caller can pass an
 * `excludeWorkoutId` to filter the active session out.
 */
export async function getLastSetForExercise(
  exerciseSlug: string,
  excludeWorkoutId?: string,
): Promise<ExerciseHistory | null> {
  noStore();
  const supabase = await createClient();
  let q = supabase
    .from("workout_sets")
    .select("weight_kg, reps, rpe")
    .eq("exercise_slug", exerciseSlug)
    .eq("was_warmup", false)
    .not("weight_kg", "is", null)
    .not("reps", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (excludeWorkoutId) {
    q = q.neq("workout_id", excludeWorkoutId);
  }

  const { data, error } = await q.maybeSingle();

  if (error || !data || data.weight_kg == null || data.reps == null) {
    if (error) console.error("getLastSetForExercise error:", error);
    return null;
  }
  return {
    weight_lb: kgToLb(data.weight_kg),
    reps: data.reps,
    rpe: data.rpe,
  };
}

/** @deprecated Use {@link getLastSetForExercise}. Kept for backwards-compat. */
export const getLastRatedSetForExercise = getLastSetForExercise;

/**
 * Most-recent completed sets for a given exercise. Returned newest first.
 */
export async function getRecentSetsForExercise(
  exerciseSlug: string,
  limit = 6,
): Promise<WorkoutSet[]> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_sets")
    .select(
      "id, workout_id, exercise_slug, set_number, reps, weight_kg, rpe, was_warmup, created_at",
    )
    .eq("exercise_slug", exerciseSlug)
    .eq("was_warmup", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentSetsForExercise error:", error);
    return [];
  }
  return data ?? [];
}
