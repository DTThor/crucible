import { requireUser } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { ActiveWorkoutCard } from "@/components/active-workout-card";
import { StartWorkoutCard } from "@/components/start-workout-card";
import {
  getActiveWorkout,
  getWorkoutSets,
} from "@/lib/training/queries";
import { getTodayTraining } from "@/lib/training/templates";

export const dynamic = "force-dynamic";

export default async function TrainPage() {
  await requireUser();

  const active = await getActiveWorkout();
  const sets = active ? await getWorkoutSets(active.id) : [];
  const today = getTodayTraining();

  return (
    <>
      <PageHeader
        title="Train"
        subtitle={active ? "In progress" : today.label}
      />
      <div className="space-y-3">
        {active ? (
          <ActiveWorkoutCard workout={active} initialSets={sets} />
        ) : (
          <StartWorkoutCard today={today} />
        )}
      </div>
    </>
  );
}
