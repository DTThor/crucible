import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface RawWorkout {
  id: string;
  type: string;
  template_slug: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface WorkoutDebugSnapshot {
  rows: RawWorkout[];
  totalCount: number;
  totalSetsCount: number;
  error: string | null;
}

export async function getWorkoutDebugSnapshot(
  limit = 10,
): Promise<WorkoutDebugSnapshot> {
  noStore();
  const supabase = await createClient();

  const [rowsResult, countResult, setsCountResult] = await Promise.all([
    supabase
      .from("workouts")
      .select(
        "id, type, template_slug, started_at, ended_at, status, notes, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("workouts").select("id", { count: "exact", head: true }),
    supabase.from("workout_sets").select("id", { count: "exact", head: true }),
  ]);

  if (rowsResult.error) {
    return {
      rows: [],
      totalCount: 0,
      totalSetsCount: 0,
      error: rowsResult.error.message,
    };
  }

  return {
    rows: rowsResult.data ?? [],
    totalCount: countResult.count ?? 0,
    totalSetsCount: setsCountResult.count ?? 0,
    error: null,
  };
}
