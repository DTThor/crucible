import { requireUser } from "@/lib/auth-guard";
import { ActiveWorkoutCard } from "@/components/active-workout-card";
import { HeroWorkoutCard } from "@/components/hero-workout-card";
import { TabHeader } from "@/components/tab-header";
import { formatTodayDate, getGreeting } from "@/lib/copy";
import {
  getActiveWorkout,
  getWorkoutSets,
} from "@/lib/training/queries";
import { getTodayTraining } from "@/lib/training/templates";
import {
  getProfile,
  resolveInitials,
  resolveName,
} from "@/lib/profile/queries";

export const dynamic = "force-dynamic";

export default async function TrainPage() {
  const user = await requireUser();
  const [profile, active] = await Promise.all([
    getProfile(),
    getActiveWorkout(),
  ]);
  const sets = active ? await getWorkoutSets(active.id) : [];

  const today = getTodayTraining();
  const now = new Date();
  const name = resolveName(profile, user.email ?? "");
  const initials = resolveInitials(name);
  const greeting = `${getGreeting(now)}, ${name}`;
  const subtitle = active
    ? `${formatTodayDate(now)} · Workout in progress`
    : formatTodayDate(now);

  return (
    <div className="space-y-5">
      <TabHeader
        avatarUrl={profile?.avatar_url ?? null}
        initials={initials}
        greeting={greeting}
        subtitle={subtitle}
      />
      {active ? (
        <ActiveWorkoutCard workout={active} initialSets={sets} />
      ) : (
        <HeroWorkoutCard today={today} />
      )}
    </div>
  );
}
