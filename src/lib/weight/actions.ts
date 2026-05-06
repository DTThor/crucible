"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lbToKg } from "@/lib/units";

type ActionResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });
const ok = (): ActionResult => ({ ok: true });

/** Log a weight entry from a lb input value. */
export async function logWeight(lb: number): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!Number.isFinite(lb) || lb <= 0 || lb > 1000) {
    return fail("Invalid weight.");
  }

  const { error } = await supabase
    .from("weight_logs")
    .insert({
      user_id: user.id,
      weight_kg: lbToKg(lb),
      source: "manual",
    });

  if (error) {
    console.error("logWeight error:", error);
    return fail("Could not save weight.");
  }

  revalidatePath("/", "layout");
  return ok();
}
