import { requireUser } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { ActiveFastCard } from "@/components/active-fast-card";
import { StartFastCard } from "@/components/start-fast-card";
import { getActiveFast } from "@/lib/fasting/queries";
import { getTodayProtocol } from "@/lib/fasting/templates";
import { PROTOCOLS } from "@/lib/fasting/protocols";

export const dynamic = "force-dynamic";

export default async function FastPage() {
  await requireUser();

  const active = await getActiveFast();
  const todayProtocol = getTodayProtocol();
  const todayName = PROTOCOLS[todayProtocol].name;

  return (
    <>
      <PageHeader
        title="Fast"
        subtitle={active ? "In progress" : `Today's plan: ${todayName}`}
      />

      <div className="space-y-4">
        {active ? (
          <ActiveFastCard
            fastId={active.id}
            protocolSlug={active.protocol_slug}
            startedAt={active.started_at}
            plannedEndAt={active.planned_end_at}
          />
        ) : (
          <StartFastCard todayProtocol={todayProtocol} />
        )}
      </div>
    </>
  );
}
