import { requireUser } from "@/lib/auth-guard";
import { ActiveWorkoutCard } from "@/components/active-workout-card";
import { HeroWorkoutCard } from "@/components/hero-workout-card";
import { TrainHomeHeader } from "@/components/train-home-header";
import {
  buildDayStrip,
  deriveName,
  getGreeting,
  getTrainSubtitle,
} from "@/lib/training/copy";
import {
  getActiveWorkout,
  getWorkoutSets,
} from "@/lib/training/queries";
import { getTodayTraining } from "@/lib/training/templates";

export const dynamic = "force-dynamic";

export default async function TrainPage() {
  const user = await requireUser();

  const active = await getActiveWorkout();
  const sets = active ? await getWorkoutSets(active.id) : [];
  const today = getTodayTraining();
  const subtitle = getTrainSubtitle(today.label, today.type);

  // Compute the header data server-side so the component can stay pure.
  const now = new Date();
  const name = deriveName(user.email ?? "");
  const initials = name.charAt(0).toUpperCase();
  const greeting = getGreeting(now);
  const dayStrip = buildDayStrip(now);

  return (
    <div className="space-y-5 pt-4">
      <TrainHomeHeader
        greeting={greeting}
        name={name}
        initials={initials}
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
