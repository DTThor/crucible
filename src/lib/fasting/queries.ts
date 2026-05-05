import { createClient } from "@/lib/supabase/server";

/**
 * Server-side queries for fasting data. RLS in Supabase restricts results
 * to the authenticated user automatically, so no user_id filter needed.
 */

export interface ActiveFast {
  id: string;
  protocol_slug: string;
  started_at: string;
  planned_end_at: string | null;
  notes: string | null;
}

/** The user's currently active fast, or null if none. */
export async function getActiveFast(): Promise<ActiveFast | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fasts")
    .select("id, protocol_slug, started_at, planned_end_at, notes")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getActiveFast error:", error);
    return null;
  }
  return data;
}
