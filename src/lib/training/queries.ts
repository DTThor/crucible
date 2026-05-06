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

/**
 * Most-recent completed sets for a given exercise, used by the smart
 * weight suggestion logic in Slice 2B. Returned newest first.
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
