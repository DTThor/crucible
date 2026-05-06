"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });

async function authedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function updateDisplayName(
  displayName: string,
): Promise<ActionResult> {
  const { supabase, user } = await authedClient();

  const trimmed = displayName.trim();
  if (trimmed.length > 60) return fail("Name is too long.");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed.length > 0 ? trimmed : null })
    .eq("user_id", user.id);

  if (error) {
    console.error("updateDisplayName error:", error);
    return fail(error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateAvatarUrl(
  avatarUrl: string | null,
): Promise<ActionResult> {
  const { supabase, user } = await authedClient();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", user.id);

  if (error) {
    console.error("updateAvatarUrl error:", error);
    return fail(error.message);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
