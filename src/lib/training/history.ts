/**
 * History queries for workouts. Server-only — uses the Supabase server
 * client. Pure helpers (computeWorkoutStats, etc.) live in
 * `history-utils.ts` so client components can import them without
 * pulling in the Supabase server client.
 */
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { kgToLb } from "@/lib/units";
import { startOfDayUtcIso, todayKey } from "@/lib/tz";
import { getTemplate } from "./templates";
import { getExercise } from "./exercises";

export type {
  HistoricWorkout,
  WorkoutStats,
  ExercisePoint,
  ExerciseSummary,
} from "./history-utils";
export { computeWorkoutStats } from "./history-utils";

import type {
  HistoricWorkout,
  WorkoutStats,
  ExercisePoint,
  ExerciseSummary,
} from "./history-utils";

/**
 * Recent finished workouts (completed OR abandoned), with sets joined so
 * we can compute total volume + set count without a follow-up query per
 * row. Limited to `limit` rows for the list view.
 */
export async function getRecentWorkouts(limit = 30): Promise<HistoricWorkout[]> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workouts")
    .select(
      `id, type, template_slug, started_at, ended_at, status, notes, details,
       workout_sets ( weight_kg, reps, was_warmup )`,
    )
    .neq("status", "active")
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentWorkouts error:", error);
    return [];
  }

  return (data ?? []).map((w) => {
    const sets = (w.workout_sets ?? []) as Array<{
      weight_kg: number | null;
      reps: number | null;
      was_warmup: boolean;
    }>;
    const working = sets.filter((s) => !s.was_warmup);
    const totalVolumeLb = working.reduce((acc, s) => {
      if (s.weight_kg == null || s.reps == null) return acc;
      return acc + kgToLb(s.weight_kg) * s.reps;
    }, 0);
    const startMs = new Date(w.started_at).getTime();
    const endMs = w.ended_at ? new Date(w.ended_at).getTime() : Date.now();
    const template = w.template_slug ? getTemplate(w.template_slug) : null;
    const title =
      template?.name ?? w.type.charAt(0).toUpperCase() + w.type.slice(1);
    return {
      id: w.id,
      type: w.type,
      template_slug: w.template_slug,
      title,
      started_at: w.started_at,
      ended_at: w.ended_at,
      status: w.status,
      notes: w.notes,
      duration_min: Math.max(0, (endMs - startMs) / 60_000),
      set_count: working.length,
      total_volume_lb: totalVolumeLb,
      details:
        (w as unknown as { details?: Record<string, unknown> | null })
          .details ?? null,
    };
  });
}

/**
 * All finished workouts that started today (in the user's local time —
 * assumes America/Chicago to match the rest of the app). Newest first.
 * Used by the Train tab to switch from the "today's plan" hero to a
 * "you already trained today" card. Includes lift + cardio + recovery
 * + GTX so a multi-session day (e.g. morning lift + afternoon sauna)
 * surfaces both.
 */
export async function getTodayCompletedWorkouts(): Promise<HistoricWorkout[]> {
  noStore();
  const supabase = await createClient();

  // DST-correct "start of today in Chicago" as a UTC ISO timestamp.
  const sinceLocalMidnight = startOfDayUtcIso(todayKey());

  const { data, error } = await supabase
    .from("workouts")
    .select(
      `id, type, template_slug, started_at, ended_at, status, notes, details,
       workout_sets ( weight_kg, reps, was_warmup )`,
    )
    .neq("status", "active")
    .not("ended_at", "is", null)
    .gte("started_at", sinceLocalMidnight)
    .order("started_at", { ascending: false });

  if (error) {
    console.error("getTodayCompletedWorkouts error:", error);
    return [];
  }

  return (data ?? []).map((w) => {
    const sets = (w.workout_sets ?? []) as Array<{
      weight_kg: number | null;
      reps: number | null;
      was_warmup: boolean;
    }>;
    const working = sets.filter((s) => !s.was_warmup);
    const totalVolumeLb = working.reduce((acc, s) => {
      if (s.weight_kg == null || s.reps == null) return acc;
      return acc + kgToLb(s.weight_kg) * s.reps;
    }, 0);
    const startMs = new Date(w.started_at).getTime();
    const endMs = w.ended_at ? new Date(w.ended_at).getTime() : Date.now();
    const template = w.template_slug ? getTemplate(w.template_slug) : null;
    const title =
      template?.name ?? w.type.charAt(0).toUpperCase() + w.type.slice(1);

    return {
      id: w.id,
      type: w.type,
      template_slug: w.template_slug,
      title,
      started_at: w.started_at,
      ended_at: w.ended_at,
      status: w.status,
      notes: w.notes,
      duration_min: Math.max(0, (endMs - startMs) / 60_000),
      set_count: working.length,
      total_volume_lb: totalVolumeLb,
      details:
        (w as unknown as { details?: Record<string, unknown> | null })
          .details ?? null,
    };
  });
}

/**
 * Aggregate stats across all of the user's finished workouts. Computed
 * server-side off of a 90-day window for the "this week / this month"
 * cells, and a separate count(*) lookup for lifetime totals so we don't
 * have to ship the entire history to compute three numbers.
 */
export async function getWorkoutStats(): Promise<WorkoutStats> {
  noStore();
  const supabase = await createClient();
  const since = new Date(
    Date.now() - 90 * 24 * 3_600_000,
  ).toISOString();

  const [recentRes, lifetimeRes] = await Promise.all([
    supabase
      .from("workouts")
      .select(
        `id, started_at, ended_at, status,
         workout_sets ( weight_kg, reps, was_warmup )`,
      )
      .neq("status", "active")
      .not("ended_at", "is", null)
      .gte("started_at", since),
    supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .neq("status", "active")
      .not("ended_at", "is", null),
  ]);

  if (recentRes.error) {
    console.error("getWorkoutStats recent error:", recentRes.error);
  }
  if (lifetimeRes.error) {
    console.error("getWorkoutStats lifetime error:", lifetimeRes.error);
  }

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 3_600_000;
  const monthAgo = now - 30 * 24 * 3_600_000;

  let weekCount = 0;
  let weekVolumeLb = 0;
  let monthCount = 0;
  let monthVolumeLb = 0;

  for (const w of recentRes.data ?? []) {
    const startedMs = new Date(w.started_at).getTime();
    const sets = (w.workout_sets ?? []) as Array<{
      weight_kg: number | null;
      reps: number | null;
      was_warmup: boolean;
    }>;
    const volume = sets.reduce((acc, s) => {
      if (s.was_warmup || s.weight_kg == null || s.reps == null) return acc;
      return acc + kgToLb(s.weight_kg) * s.reps;
    }, 0);

    if (startedMs >= weekAgo) {
      weekCount++;
      weekVolumeLb += volume;
    }
    if (startedMs >= monthAgo) {
      monthCount++;
      monthVolumeLb += volume;
    }
  }

  return {
    weekCount,
    weekVolumeLb,
    monthCount,
    monthVolumeLb,
    lifetimeCount: lifetimeRes.count ?? 0,
  };
}

/**
 * List of exercises the user has at least one non-warmup set for, with
 * a count and most-recent timestamp. Ordered by most-recently-used
 * first — that's what the picker should default to.
 */
export async function getExercisesWithHistory(): Promise<ExerciseSummary[]> {
  noStore();
  const supabase = await createClient();
  // Pull just the columns we need; aggregation is done in JS to keep it
  // simple. With small per-user volumes (hundreds of sets) this is fine.
  const { data, error } = await supabase
    .from("workout_sets")
    .select("exercise_slug, created_at")
    .eq("was_warmup", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getExercisesWithHistory error:", error);
    return [];
  }

  const byExercise = new Map<
    string,
    { count: number; lastIso: string }
  >();
  for (const row of data ?? []) {
    const cur = byExercise.get(row.exercise_slug);
    if (!cur) {
      byExercise.set(row.exercise_slug, {
        count: 1,
        lastIso: row.created_at,
      });
    } else {
      cur.count++;
    }
  }

  const summaries: ExerciseSummary[] = [];
  for (const [slug, agg] of byExercise.entries()) {
    const ex = getExercise(slug);
    summaries.push({
      slug,
      name: ex?.name ?? slug,
      setCount: agg.count,
      lastIso: agg.lastIso,
    });
  }
  // Most recently used first
  summaries.sort(
    (a, b) => new Date(b.lastIso).getTime() - new Date(a.lastIso).getTime(),
  );
  return summaries;
}

/**
 * Time-series data for one exercise — one point per workout where the
 * user logged at least one non-warmup set of this exercise. The "top
 * set" is the heaviest single set (ties broken by reps). RPE pulled
 * from any non-warmup set in the workout (rateExerciseDifficulty
 * writes the same value to all of them).
 */
export async function getExerciseProgression(
  exerciseSlug: string,
  limit = 30,
): Promise<ExercisePoint[]> {
  noStore();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_sets")
    .select(
      `workout_id, weight_kg, reps, rpe,
       workouts!inner ( started_at, ended_at, status )`,
    )
    .eq("exercise_slug", exerciseSlug)
    .eq("was_warmup", false)
    .not("weight_kg", "is", null)
    .not("reps", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getExerciseProgression error:", error);
    return [];
  }

  // Group by workout, find top set per workout.
  const byWorkout = new Map<
    string,
    {
      startedIso: string;
      ended: boolean;
      topWeightLb: number;
      topReps: number;
      totalVolumeLb: number;
      setCount: number;
      rpe: number | null;
    }
  >();

  for (const row of data ?? []) {
    if (row.weight_kg == null || row.reps == null) continue;
    // Supabase typings on inner joins surface as array; coerce.
    const w = Array.isArray(row.workouts) ? row.workouts[0] : row.workouts;
    if (!w) continue;
    const ended = w.status !== "active" && w.ended_at != null;
    const weightLb = kgToLb(row.weight_kg);
    const cur = byWorkout.get(row.workout_id);
    if (!cur) {
      byWorkout.set(row.workout_id, {
        startedIso: w.started_at,
        ended,
        topWeightLb: weightLb,
        topReps: row.reps,
        totalVolumeLb: weightLb * row.reps,
        setCount: 1,
        rpe: row.rpe ?? null,
      });
    } else {
      cur.totalVolumeLb += weightLb * row.reps;
      cur.setCount++;
      // Heavier weight wins; on tie, more reps wins.
      if (
        weightLb > cur.topWeightLb ||
        (weightLb === cur.topWeightLb && row.reps > cur.topReps)
      ) {
        cur.topWeightLb = weightLb;
        cur.topReps = row.reps;
      }
      if (cur.rpe == null && row.rpe != null) cur.rpe = row.rpe;
    }
  }

  const points: ExercisePoint[] = [];
  for (const [workoutId, p] of byWorkout.entries()) {
    points.push({
      workoutId,
      startedIso: p.startedIso,
      topWeightLb: p.topWeightLb,
      topReps: p.topReps,
      totalVolumeLb: p.totalVolumeLb,
      setCount: p.setCount,
      rpe: p.rpe,
    });
  }
  // Oldest → newest, capped at `limit` most recent.
  points.sort(
    (a, b) =>
      new Date(a.startedIso).getTime() - new Date(b.startedIso).getTime(),
  );
  return points.slice(-limit);
}
