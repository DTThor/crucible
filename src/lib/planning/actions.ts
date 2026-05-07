"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PlanInput } from "./types";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });

async function authedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/**
 * Upsert a planning override for a specific date. `dateIso` must be
 * YYYY-MM-DD in the user's local TZ; we don't infer it. Pass null
 * fields to clear them on the row (different from clearing the whole
 * row, which is `clearPlannedDay`).
 */
export async function setPlannedDay(
  dateIso: string,
  input: PlanInput,
): Promise<ActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    return fail("Invalid date.");
  }
  const { supabase, user } = await authedClient();

  const { error } = await supabase.from("planned_days").upsert(
    {
      user_id: user.id,
      date: dateIso,
      workout_type: input.workoutType,
      workout_template_slug:
        input.workoutType === "lift"
          ? input.workoutTemplateSlug ?? null
          : null,
      fasting_protocol_slug: input.fastingProtocolSlug ?? null,
      notes: input.notes ?? null,
    },
    { onConflict: "user_id,date" },
  );

  if (error) {
    console.error("setPlannedDay error:", error);
    return fail(error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Drop the override row for this date. The page will fall back to the
 * recurring weekday default for everything.
 */
export async function clearPlannedDay(dateIso: string): Promise<ActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    return fail("Invalid date.");
  }
  const { supabase } = await authedClient();
  const { error } = await supabase
    .from("planned_days")
    .delete()
    .eq("date", dateIso);
  if (error) {
    console.error("clearPlannedDay error:", error);
    return fail(error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
