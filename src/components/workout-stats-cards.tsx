import { Calendar, BarChart3, Trophy } from "lucide-react";
import {
  formatVolume,
  type WorkoutStats,
} from "@/lib/training/history-utils";

interface WorkoutStatsCardsProps {
  stats: WorkoutStats;
}

/**
 * Top-of-page snapshot for /train/history. Three cards:
 *   This week  — workouts + volume in last 7 days
 *   This month — workouts + volume in last 30 days
 *   Lifetime   — total finished workouts (volume omitted; would need a
 *                full scan to compute, not worth it for a header card)
 */
export function WorkoutStatsCards({ stats }: WorkoutStatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <StatCell
        icon={<Calendar className="h-4 w-4 text-sky-400" />}
        label="This week"
        value={stats.weekCount.toString()}
        unit={
          stats.weekVolumeLb > 0
            ? `${formatVolume(stats.weekVolumeLb)} lb`
            : "workouts"
        }
      />
      <StatCell
        icon={<BarChart3 className="h-4 w-4 text-emerald-400" />}
        label="30d"
        value={stats.monthCount.toString()}
        unit={
          stats.monthVolumeLb > 0
            ? `${formatVolume(stats.monthVolumeLb)} lb`
            : "workouts"
        }
      />
      <StatCell
        icon={<Trophy className="h-4 w-4 text-amber-400" />}
        label="Lifetime"
        value={stats.lifetimeCount.toString()}
        unit="workouts"
      />
    </div>
  );
}

function StatCell({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-2.5 py-2.5">
      <div className="flex items-center gap-1">
        {icon}
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums leading-tight">
        {value}
      </p>
      <p className="truncate text-[10px] text-muted-foreground">{unit}</p>
    </div>
  );
}
