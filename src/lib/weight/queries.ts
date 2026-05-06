import { createClient } from "@/lib/supabase/server";

export interface WeightLog {
  id: string;
  weight_kg: number;
  logged_at: string;
  source: string;
}

/** All weight logs in the last `days` days, oldest first (chart-friendly). */
export async function getRecentWeightLogs(days = 30): Promise<WeightLog[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 3_600_000).toISOString();

  const { data, error } = await supabase
    .from("weight_logs")
    .select("id, weight_kg, logged_at, source")
    .gte("logged_at", since)
    .order("logged_at", { ascending: true });

  if (error) {
    console.error("getRecentWeightLogs error:", error);
    return [];
  }
  return data ?? [];
}

/** Most-recent weight log, or null if none. */
export async function getLatestWeight(): Promise<WeightLog | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weight_logs")
    .select("id, weight_kg, logged_at, source")
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestWeight error:", error);
    return null;
  }
  return data;
}

/**
 * Closest weight log to N days ago — used for trend deltas.
 * Returns null if no log within the window.
 */
export async function getWeightAround(daysAgo: number): Promise<WeightLog | null> {
  const supabase = await createClient();
  const target = new Date(Date.now() - daysAgo * 24 * 3_600_000);
  const windowStart = new Date(target.getTime() - 2 * 24 * 3_600_000).toISOString();
  const windowEnd = new Date(target.getTime() + 2 * 24 * 3_600_000).toISOString();

  const { data, error } = await supabase
    .from("weight_logs")
    .select("id, weight_kg, logged_at, source")
    .gte("logged_at", windowStart)
    .lte("logged_at", windowEnd)
    .order("logged_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("getWeightAround error:", error);
    return null;
  }
  return data?.[0] ?? null;
}
