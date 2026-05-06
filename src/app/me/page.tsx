import { requireUser } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "./theme-toggle";
import { EndAllFastsButton } from "@/components/end-all-fasts-button";

export const dynamic = "force-dynamic";

const VERSION = "0.6.0";

export default async function MePage() {
  const user = await requireUser();

  // Set by Vercel automatically; useful for verifying which deploy you're on.
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const deployedAt = process.env.VERCEL_GIT_COMMIT_REF
    ? `${process.env.VERCEL_GIT_COMMIT_REF}@${sha}`
    : sha;

  return (
    <>
      <PageHeader title="Me" />
      <div className="space-y-4">
        <Card>
          <CardContent className="py-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Account
            </p>
            <p className="mt-1 font-medium">{user.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-5">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                Light, dark, or system
              </p>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-5">
            <div>
              <p className="font-medium">Cleanup</p>
              <p className="text-sm text-muted-foreground">
                Force-end every fast currently marked active. Use if the timer
                is showing a stale fast from earlier testing.
              </p>
            </div>
            <EndAllFastsButton />
          </CardContent>
        </Card>

        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="w-full rounded-2xl border border-destructive/50 bg-card py-4 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            Sign out
          </button>
        </form>

        <p className="px-1 pt-2 text-center text-xs text-muted-foreground">
          Crucible · v{VERSION} · {deployedAt}
        </p>
      </div>
    </>
  );
}
