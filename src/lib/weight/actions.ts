"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lbToKg } from "@/lib/units";

type ActionResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });
const ok = (): ActionResult => ({ ok: true });

/**
 * Log a weight entry from a lb input value.
 * `loggedAtIso` is optional; defaults to now. Future timestamps are clamped.
 */
export async function logWeight(
  lb: number,
  loggedAtIso?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!Number.isFinite(lb) || lb <= 0 || lb > 1000) {
    return fail("Invalid weight.");
  }

  let loggedAt = new Date();
  if (loggedAtIso) {
    const parsed = new Date(loggedAtIso);
    if (!Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now()) {
      loggedAt = parsed;
    }
  }

  const { error } = await supabase.from("weight_logs").insert({
    user_id: user.id,
    weight_kg: lbToKg(lb),
    source: "manual",
    logged_at: loggedAt.toISOString(),
  });

  if (error) {
    console.error("logWeight error:", error);
    return fail("Could not save weight.");
  }

  revalidatePath("/", "layout");
  return ok();
}
