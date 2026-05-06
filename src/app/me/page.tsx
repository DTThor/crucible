import { requireUser } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "./theme-toggle";
import {
  EndAllFastsButton,
  DeleteAllFastsButton,
} from "@/components/end-all-fasts-button";
import {
  EndAllWorkoutsButton,
  DeleteAllWorkoutsButton,
} from "@/components/end-all-workouts-button";
import { DebugFastsPanel } from "@/components/debug-fasts-panel";
import { DebugWorkoutsPanel } from "@/components/debug-workouts-panel";
import { getDebugSnapshot } from "@/lib/fasting/debug";
import { getWorkoutDebugSnapshot } from "@/lib/training/debug";

export const dynamic = "force-dynamic";

const VERSION = "0.7.4";

export default async function MePage() {
  const user = await requireUser();
  const [fastSnapshot, workoutSnapshot] = await Promise.all([
    getDebugSnapshot(20),
    getWorkoutDebugSnapshot(10),
  ]);

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
              <p className="font-medium">Fast cleanup</p>
              <p className="text-sm text-muted-foreground">
                Force-end any fasts marked active. Use if a fast looks stuck.
              </p>
            </div>
            <EndAllFastsButton />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-5">
            <div>
              <p className="font-medium">Workout cleanup</p>
              <p className="text-sm text-muted-foreground">
                Force-end any workouts marked active. Use if a workout looks
                stuck or you forgot to end one.
              </p>
            </div>
            <EndAllWorkoutsButton />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-5">
            <div>
              <p className="font-medium">Reset fast data</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete every fast in your history. Cannot be undone.
              </p>
            </div>
            <DeleteAllFastsButton />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-5">
            <div>
              <p className="font-medium">Reset workout data</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete every workout and set in your history. Cannot
                be undone.
              </p>
            </div>
            <DeleteAllWorkoutsButton />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 py-5">
            <DebugFastsPanel snapshot={fastSnapshot} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 py-5">
            <DebugWorkoutsPanel snapshot={workoutSnapshot} />
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
