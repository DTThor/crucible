import { createClient } from "@/lib/supabase/server";
import type { HistoricFast } from "./history-utils";

export type {
  HistoricFast,
  FastStats,
  HeatmapDay,
} from "./history-utils";
export { computeFastStats, buildHeatmapDays } from "./history-utils";

/** All fasts in the last `days` days, including the active one if any. */
export async function getFastHistory(days = 90): Promise<HistoricFast[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 3_600_000).toISOString();

  const { data, error } = await supabase
    .from("fasts")
    .select("id, protocol_slug, started_at, ended_at, status, notes")
    .gte("started_at", since)
    .order("started_at", { ascending: false });

  if (error) {
    console.error("getFastHistory error:", error);
    return [];
  }
  return (data ?? []).map((f) => {
    const endMs = f.ended_at ? new Date(f.ended_at).getTime() : Date.now();
    const startMs = new Date(f.started_at).getTime();
    return {
      ...f,
      duration_hours: Math.max(0, (endMs - startMs) / 3_600_000),
    };
  });
}
