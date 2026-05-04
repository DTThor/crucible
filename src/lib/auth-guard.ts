import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Page-level auth guard. Use at the top of any server component
 * that should not render for signed-out users:
 *
 *   const user = await requireUser();
 *   // user is non-null below this line
 *
 * Defense in depth — middleware is the primary gate, but pages don't
 * trust it.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}
