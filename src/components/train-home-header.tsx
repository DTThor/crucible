import { cn } from "@/lib/utils";
import { ProfileBadge } from "@/components/profile-badge";
import type { DayStripEntry } from "@/lib/training/copy";

interface TrainHomeHeaderProps {
  greeting: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  subtitle?: string;
  dayStrip: DayStripEntry[];
}

/**
 * Pure presentational header for the Train tab. All time-derived values
 * are computed server-side and passed in — no client hooks.
 */
export function TrainHomeHeader({
  greeting,
  name,
  initials,
  avatarUrl,
  subtitle,
  dayStrip,
}: TrainHomeHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <ProfileBadge
          avatarUrl={avatarUrl}
          initials={initials}
          size={48}
        />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold leading-tight text-primary">
            {greeting}, {name}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between gap-1">
        {dayStrip.map((d, i) => (
          <div
            key={i}
            className="flex flex-1 flex-col items-center gap-1 py-1.5"
          >
            <div
              className={cn(
                "h-0.5 w-full rounded-full",
                d.isToday ? "bg-foreground" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "text-xs font-mono tabular-nums",
                d.isToday
                  ? "font-bold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {d.isToday ? "TODAY" : d.date}
            </span>
            {!d.isToday && (
              <span className="text-[9px] text-muted-foreground">
                {d.dayName}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
