import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  units_weight: string;
  timezone: string;
}

export async function getProfile(): Promise<Profile | null> {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url, units_weight, timezone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getProfile error:", error);
    return null;
  }
  return data;
}

/**
 * Resolve a display name from the profile, falling back to the local part of
 * the email if the user hasn't set one.
 */
export function resolveName(
  profile: Profile | null,
  emailFallback: string,
): string {
  if (profile?.display_name && profile.display_name.trim().length > 0) {
    return profile.display_name.trim();
  }
  if (!emailFallback) return "there";
  const local = emailFallback.split("@")[0] ?? emailFallback;
  const first = local.split(/[._-]/)[0] ?? local;
  if (!first) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function resolveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
  }
  return (name[0] ?? "?").toUpperCase();
}
