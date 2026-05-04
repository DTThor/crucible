import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every request EXCEPT:
     * - /api/* (route handlers manage their own auth)
     * - /_next/* (Next assets)
     * - any file with an extension (.png, .svg, .json, .js, .ico, etc.)
     */
    "/((?!api|_next|.*\\..*).*)",
  ],
};
