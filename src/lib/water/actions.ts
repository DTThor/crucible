"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ozToMl } from "@/lib/units";

type ActionResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });
const ok = (): ActionResult => ({ ok: true });

/** Log a quick-add water amount (in oz). */
export async function logWater(oz: number): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!Number.isFinite(oz) || oz <= 0 || oz > 200) {
    return fail("Invalid amount.");
  }

  const { error } = await supabase
    .from("water_logs")
    .insert({ user_id: user.id, ml: ozToMl(oz) });

  if (error) {
    console.error("logWater error:", error);
    return fail("Could not log water.");
  }

  revalidatePath("/", "layout");
  return ok();
}

/** Delete a specific water log (used for undo). RLS blocks foreign rows. */
export async function deleteWaterLog(logId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("water_logs")
    .delete()
    .eq("id", logId);

  if (error) {
    console.error("deleteWaterLog error:", error);
    return fail("Could not delete log.");
  }

  revalidatePath("/", "layout");
  return ok();
}
