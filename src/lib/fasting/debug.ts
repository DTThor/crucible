import { unstable_noStore as noStore } from "next/cache";
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

export interface DebugSnapshot {
  rows: RawFast[];
  totalCount: number;
  userIdSuffix: string; // last 6 chars of auth.uid for sanity-check
  error: string | null;
}

/**
 * Read the user's most recent fast rows directly. No cache, no transforms —
 * pure DB state for debugging. Returns errors visibly instead of returning
 * an empty array.
 */
export async function getDebugSnapshot(limit = 20): Promise<DebugSnapshot> {
  noStore();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userIdSuffix = user?.id.slice(-6) ?? "—";

  const [rowsResult, countResult] = await Promise.all([
    supabase
      .from("fasts")
      .select(
        "id, protocol_slug, started_at, ended_at, planned_end_at, status, notes, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("fasts").select("id", { count: "exact", head: true }),
  ]);

  if (rowsResult.error) {
    return {
      rows: [],
      totalCount: 0,
      userIdSuffix,
      error: rowsResult.error.message,
    };
  }

  return {
    rows: rowsResult.data ?? [],
    totalCount: countResult.count ?? 0,
    userIdSuffix,
    error: countResult.error?.message ?? null,
  };
}
