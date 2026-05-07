import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import {
  getExerciseProgression,
  getExercisesWithHistory,
  getRecentWorkouts,
  getWorkoutStats,
} from "@/lib/training/history";
import { WorkoutStatsCards } from "@/components/workout-stats-cards";
import { ExerciseProgressionChart } from "@/components/exercise-progression-chart";
import { WorkoutHistoryList } from "@/components/workout-history-list";

export const dynamic = "force-dynamic";

export default async function TrainHistoryPage() {
  await requireUser();

  const [stats, exercises, recent] = await Promise.all([
    getWorkoutStats(),
    getExercisesWithHistory(),
    getRecentWorkouts(30),
  ]);

  // Pre-fetch the progression for the first exercise (most recently used)
  // so the chart paints something on the very first server render.
  const initialSlug = exercises[0]?.slug ?? null;
  const initialPoints = initialSlug
    ? await getExerciseProgression(initialSlug)
    : [];

  return (
    <>
      <header
        className="sticky top-0 z-30 -mx-4 mb-3 flex items-center gap-2 border-b border-border bg-background/80 px-4 py-3 backdrop-blur"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <Link
          href="/train"
          className="-ml-2 flex items-center gap-0.5 rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Train</span>
        </Link>
        <h1 className="ml-1 text-lg font-semibold tracking-tight">History</h1>
      </header>

      <div className="space-y-4">
        <WorkoutStatsCards stats={stats} />

        <section className="space-y-2">
          <p className="px-1 text-sm font-semibold">Progression</p>
          <ExerciseProgressionChart
            exercises={exercises}
            initialPoints={initialPoints}
            initialSlug={initialSlug}
          />
        </section>

        <section className="space-y-2">
          <p className="px-1 text-sm font-semibold">Recent workouts</p>
          <WorkoutHistoryList workouts={recent} />
        </section>
      </div>
    </>
  );
}
