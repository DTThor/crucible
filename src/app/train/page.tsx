import { requireUser } from "@/lib/auth-guard";
import { ActiveWorkoutCard } from "@/components/active-workout-card";
import { HeroWorkoutCard } from "@/components/hero-workout-card";
import { TrainHomeHeader } from "@/components/train-home-header";
import {
  buildDayStrip,
  getGreeting,
  getTrainSubtitle,
} from "@/lib/training/copy";
import {
  getActiveWorkout,
  getWorkoutSets,
} from "@/lib/training/queries";
import { getTodayTraining } from "@/lib/training/templates";
import { getProfile, resolveInitials, resolveName } from "@/lib/profile/queries";

export const dynamic = "force-dynamic";

export default async function TrainPage() {
  const user = await requireUser();
  const [profile, active] = await Promise.all([
    getProfile(),
    getActiveWorkout(),
  ]);
  const sets = active ? await getWorkoutSets(active.id) : [];

  const today = getTodayTraining();
  const subtitle = getTrainSubtitle(today.label, today.type);

  const now = new Date();
  const name = resolveName(profile, user.email ?? "");
  const initials = resolveInitials(name);
  const greeting = getGreeting(now);
  const dayStrip = buildDayStrip(now);

  return (
    <div className="space-y-5 pt-4">
      <TrainHomeHeader
        greeting={greeting}
        name={name}
        initials={initials}
        avatarUrl={profile?.avatar_url ?? null}
        subtitle={active ? "Workout in progress" : subtitle}
        dayStrip={dayStrip}
      />
      {active ? (
        <ActiveWorkoutCard workout={active} initialSets={sets} />
      ) : (
        <HeroWorkoutCard today={today} />
      )}
    </div>
  );
}
