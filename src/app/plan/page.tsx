import { requireUser } from "@/lib/auth-guard";
import { TabHeader } from "@/components/tab-header";
import { PlanList } from "@/components/plan-list";
import { BfcacheRefresher } from "@/components/bfcache-refresher";
import { getUpcomingPlannedDays } from "@/lib/planning/queries";
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

      <PlanList days={days} />
    </div>
  );
}
