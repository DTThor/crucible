import Link from "next/link";
import { ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import {
  formatDuration,
  formatVolume,
  type HistoricWorkout,
} from "@/lib/training/history-utils";

interface WorkoutHistoryListProps {
  workouts: HistoricWorkout[];
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAY_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function WorkoutHistoryList({ workouts }: WorkoutHistoryListProps) {
  if (workouts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
        No finished workouts yet.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {workouts.map((w) => {
        const abandoned = w.status === "abandoned";
        return (
          <li key={w.id}>
            <Link
              href={`/train/history/${w.id}`}
              className="flex items-center gap-2 px-3 py-2.5 hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{w.title}</p>
                  {abandoned ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                      <XCircle className="h-3 w-3" />
                      Abandoned
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Done
                    </span>
                  )}
                </div>
                <p className="text-[10px] tabular-nums text-muted-foreground">
                  {formatDay(w.started_at)} · {formatDuration(w.duration_min)}
                  {w.set_count > 0 && ` · ${w.set_count} sets`}
                  {w.total_volume_lb > 0 &&
                    ` · ${formatVolume(w.total_volume_lb)} lb`}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
