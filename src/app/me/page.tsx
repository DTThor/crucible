import { requireUser } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "./theme-toggle";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await requireUser();
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
              <p className="text-sm text-muted-foreground">Light, dark, or system</p>
            </div>
            <ThemeToggle />
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
          Crucible · v0.1.0
        </p>
      </div>
    </>
  );
}
