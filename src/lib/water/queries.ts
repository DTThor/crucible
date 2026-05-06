import { createClient } from "@/lib/supabase/server";

export interface WaterLog {
  id: string;
  ml: number;
  logged_at: string;
}

/**
 * Last N days of water logs, newest first. Client filters to "today" using
 * its own local timezone — keeps timezone math out of the server.
 */
export async function getRecentWaterLogs(days = 7): Promise<WaterLog[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 3_600_000).toISOString();

  const { data, error } = await supabase
    .from("water_logs")
    .select("id, ml, logged_at")
    .gte("logged_at", since)
    .order("logged_at", { ascending: false });

  if (error) {
    console.error("getRecentWaterLogs error:", error);
    return [];
  }
  return data ?? [];
}
