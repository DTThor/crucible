import { Flame, Timer, BarChart3, Target } from "lucide-react";
import type { FastStats } from "@/lib/fasting/history";

interface AggregateStatsProps {
  stats: FastStats;
}

export function AggregateStats({ stats }: AggregateStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCell
        icon={<Flame className="h-4 w-4 text-orange-400" />}
        label="Streak"
        value={stats.streakDays.toString()}
        unit="days"
      />
      <StatCell
        icon={<Timer className="h-4 w-4 text-emerald-400" />}
        label="Avg fast"
        value={stats.avgFastHours30d.toFixed(1)}
        unit="hr · 30d"
      />
      <StatCell
        icon={<BarChart3 className="h-4 w-4 text-sky-400" />}
        label="This week"
        value={Math.round(stats.weeklyFastHours).toString()}
        unit="hours"
      />
      <StatCell
        icon={<Target className="h-4 w-4 text-amber-400" />}
        label="Fasts"
        value={stats.totalFasts30d.toString()}
        unit="last 30d"
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
    <div className="rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums leading-tight">
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{unit}</p>
    </div>
  );
}
