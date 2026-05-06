import { requireUser } from "@/lib/auth-guard";
import { ActiveWorkoutCard } from "@/components/active-workout-card";
import { HeroWorkoutCard } from "@/components/hero-workout-card";
import {
  TrainHomeHeader,
  getTrainSubtitle,
} from "@/components/train-home-header";
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

  return (
    <div className="space-y-5 pt-4">
      {active ? (
        <>
          <TrainHomeHeader
            identifier={user.email ?? ""}
            subtitle="Workout in progress"
          />
          <ActiveWorkoutCard workout={active} initialSets={sets} />
        </>
      ) : (
        <>
          <TrainHomeHeader identifier={user.email ?? ""} subtitle={subtitle} />
          <HeroWorkoutCard today={today} />
        </>
      )}
    </div>
  );
}
