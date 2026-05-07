import { requireUser } from "@/lib/auth-guard";
import { Card, CardContent } from "@/components/ui/card";
import { TabHeader } from "@/components/tab-header";
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
import { ProfileEditCard } from "@/components/profile-edit-card";
import { getDebugSnapshot } from "@/lib/fasting/debug";
import { getWorkoutDebugSnapshot } from "@/lib/training/debug";
import {
  getProfile,
  resolveInitials,
  resolveName,
} from "@/lib/profile/queries";
import { formatTodayDate, getGreeting } from "@/lib/copy";

export const dynamic = "force-dynamic";

const VERSION = "0.12.1";

export default async function MePage() {
  const user = await requireUser();
  const [profile, fastSnapshot, workoutSnapshot] = await Promise.all([
    getProfile(),
    getDebugSnapshot(20),
    getWorkoutDebugSnapshot(10),
  ]);

  const fallbackName = resolveName(profile, user.email ?? "");
  const initials = resolveInitials(fallbackName);
  const now = new Date();
  const greeting = `${getGreeting(now)}, ${fallbackName}`;
  const subtitle = formatTodayDate(now);

  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const deployedAt = process.env.VERCEL_GIT_COMMIT_REF
    ? `${process.env.VERCEL_GIT_COMMIT_REF}@${sha}`
    : sha;

  return (
    <div className="space-y-4">
      <TabHeader
        avatarUrl={profile?.avatar_url ?? null}
        initials={initials}
        greeting={greeting}
        subtitle={subtitle}
      />

      <ProfileEditCard
        email={user.email ?? ""}
        userId={user.id}
        initialDisplayName={profile?.display_name ?? null}
        initialAvatarUrl={profile?.avatar_url ?? null}
        initials={initials}
      />

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
              Force-end any fasts marked active.
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
              Force-end any workouts marked active.
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
              Permanently delete every fast in your history.
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
              Permanently delete every workout and set in your history.
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
  );
}
