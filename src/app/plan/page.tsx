import { AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { TabHeader } from "@/components/tab-header";
import { PlanList } from "@/components/plan-list";
import { BfcacheRefresher } from "@/components/bfcache-refresher";
import { getUpcomingPlannedDays } from "@/lib/planning/queries";
import { auditWeek } from "@/lib/planning/coaching";
import {
  getProfile,
  resolveInitials,
  resolveName,
} from "@/lib/profile/queries";
import { formatTodayDate } from "@/lib/copy";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const user = await requireUser();
  const [profile, days] = await Promise.all([
    getProfile(),
    getUpcomingPlannedDays(14),
  ]);

  const name = resolveName(profile, user.email ?? "");
  const initials = resolveInitials(name);
  const subtitle = `${formatTodayDate()} · Next 14 days`;
  const issues = auditWeek(days);

  return (
    <div className="space-y-4">
      <BfcacheRefresher />
      <TabHeader
        avatarUrl={profile?.avatar_url ?? null}
        initials={initials}
        name={name}
        subtitle={subtitle}
      />

      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        Tap any day to override what workout + fasting protocol it should
        be. Days without an override use your recurring weekday default.
      </p>

      {issues.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Coaching notes
          </div>
          <ul className="space-y-1">
            {issues.map((it, i) => (
              <li
                key={`${it.dateIso}:${i}`}
                className="text-[11px] leading-relaxed text-foreground/90"
              >
                {it.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <PlanList days={days} />
    </div>
  );
}
