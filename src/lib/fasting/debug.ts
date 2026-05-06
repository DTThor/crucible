import { createClient } from "@/lib/supabase/server";

export interface RawFast {
  id: string;
  protocol_slug: string;
  started_at: string;
  ended_at: string | null;
  planned_end_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

/**
 * Read the user's most recent fast rows directly. No filters or transforms —
 * pure DB state for debugging. RLS limits to the user's own rows.
 */
export async function getRawRecentFasts(limit = 20): Promise<RawFast[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fasts")
    .select(
      "id, protocol_slug, started_at, ended_at, planned_end_at, status, notes, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRawRecentFasts error:", error);
    return [];
  }
  return data ?? [];
}
