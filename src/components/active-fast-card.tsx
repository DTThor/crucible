"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PhaseRing } from "@/components/phase-ring";
import { ProtocolPill } from "@/components/protocol-pill";
import { PhaseInfoCard } from "@/components/phase-info-card";
import { FastTimesRow } from "@/components/fast-times-row";
import { EndFastModal } from "@/components/end-fast-modal";
import { EditStartTimeModal } from "@/components/edit-start-time-modal";
import { getCurrentPhase } from "@/lib/fasting/phases";
import {
  getProtocol,
  type ProtocolSlug,
} from "@/lib/fasting/protocols";
import {
  stopFast,
  changeActiveFastProtocol,
  updateFastStartTime,
} from "@/lib/fasting/actions";
import { CheckCircle2 } from "lucide-react";
import {
  CelebrationBanner,
  ConfettiBurst,
} from "@/components/celebration";

interface ActiveFastCardProps {
  fastId: string;
  protocolSlug: string;
  startedAt: string;
  plannedEndAt: string | null;
}

export function ActiveFastCard({
  fastId,
  protocolSlug,
  startedAt,
  plannedEndAt,
}: ActiveFastCardProps) {
  const router = useRouter();

  // Optimistic local mirrors of the server props
  const [now, setNow] = useState(() => Date.now());
  const [localStartedAt, setLocalStartedAt] = useState(startedAt);
  const [localProtocolSlug, setLocalProtocolSlug] = useState(protocolSlug);
  const [localPlannedEndAt, setLocalPlannedEndAt] = useState(plannedEndAt);
  const [localEnded, setLocalEnded] = useState(false);

  // Modal + UI state
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Celebration state — fires confetti once on first goal-reached transition
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  const [pending, startTransition] = useTransition();

  // Tick the clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Refresh from server when iOS Safari restores from bfcache
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) router.refresh();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  // Resync to server when props change
  useEffect(() => setLocalStartedAt(startedAt), [startedAt]);
  useEffect(() => setLocalProtocolSlug(protocolSlug), [protocolSlug]);
  useEffect(() => setLocalPlannedEndAt(plannedEndAt), [plannedEndAt]);

  // Derived values
  const startedAtMs = new Date(localStartedAt).getTime();
  const elapsedHours = Math.max(0, (now - startedAtMs) / 3_600_000);
  const protocol = getProtocol(localProtocolSlug);
  const targetReached = elapsedHours >= protocol.targetHours;
  const currentPhase = getCurrentPhase(elapsedHours);

  // Fire confetti the first time goal is reached. Persists across this
  // component's lifetime so it doesn't re-fire on every tick.
  useEffect(() => {
    if (targetReached && !hasCelebrated) {
      setHasCelebrated(true);
      setConfettiActive(true);
      const id = setTimeout(() => setConfettiActive(false), 3500);
      return () => clearTimeout(id);
    }
  }, [targetReached, hasCelebrated]);

  const plannedEndMs = localPlannedEndAt
    ? new Date(localPlannedEndAt).getTime()
    : startedAtMs + protocol.targetHours * 3_600_000;

  // ── Handlers ──────────────────────────────────────────────────
  function handleConfirmEnd() {
    setEndModalOpen(false);
    setLocalEnded(true);
    startTransition(async () => {
      const reason = targetReached ? "completed" : "broken_early";
      await stopFast(fastId, reason);
      // Navigate to the summary view for the just-ended fast.
      router.replace(`/fast?ended=${fastId}`);
      router.refresh();
    });
  }

  function handleProtocolChange(slug: ProtocolSlug) {
    const previous = localProtocolSlug;
    setLocalProtocolSlug(slug);
    // Recompute optimistic planned end
    setLocalPlannedEndAt(
      new Date(startedAtMs + getProtocol(slug).targetHours * 3_600_000).toISOString(),
    );
    startTransition(async () => {
      const res = await changeActiveFastProtocol(fastId, slug);
      if (!res.ok) {
        setLocalProtocolSlug(previous);
        setLocalPlannedEndAt(plannedEndAt);
      } else {
        router.refresh();
      }
    });
  }

  function handleSaveStartTime(newIso: string) {
    setEditError(null);
    const previous = localStartedAt;
    const previousEnd = localPlannedEndAt;
    setLocalStartedAt(newIso);
    setLocalPlannedEndAt(
      new Date(
        new Date(newIso).getTime() + protocol.targetHours * 3_600_000,
      ).toISOString(),
    );
    startTransition(async () => {
      const res = await updateFastStartTime(fastId, newIso);
      if (!res.ok) {
        setLocalStartedAt(previous);
        setLocalPlannedEndAt(previousEnd);
        setEditError(res.error);
      } else {
        setEditModalOpen(false);
        setEditError(null);
        router.refresh();
      }
    });
  }

  // ── Ended-optimistic UI ───────────────────────────────────────
  if (localEnded) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <p className="text-lg font-semibold">Fast ended</p>
          <p className="text-sm text-muted-foreground">Refreshing…</p>
        </CardContent>
      </Card>
    );
  }

  // ── Active fast UI ────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-3">
      <ProtocolPill
        selectedSlug={localProtocolSlug as ProtocolSlug}
        onChange={handleProtocolChange}
        disabled={pending}
      />

      <PhaseRing
        elapsedHours={elapsedHours}
        targetHours={protocol.targetHours}
        celebrating={targetReached}
      />

      {targetReached && (
        <CelebrationBanner targetHours={protocol.targetHours} />
      )}

      <PhaseInfoCard phase={currentPhase} />

      <FastTimesRow
        startedAtMs={startedAtMs}
        plannedEndMs={plannedEndMs}
        onEditStart={() => setEditModalOpen(true)}
      />

      <button
        type="button"
        onClick={() => setEndModalOpen(true)}
        disabled={pending}
        className={
          targetReached
            ? "w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
            : "w-full rounded-full border border-destructive/50 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
        }
      >
        {targetReached ? "Complete fast" : "End Fast"}
      </button>

      <EndFastModal
        open={endModalOpen}
        onClose={() => setEndModalOpen(false)}
        onConfirm={handleConfirmEnd}
        pending={pending}
        targetReached={targetReached}
      />

      <EditStartTimeModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditError(null);
        }}
        onSave={handleSaveStartTime}
        initialIso={localStartedAt}
        pending={pending}
        error={editError}
      />

      <ConfettiBurst active={confettiActive} />
    </div>
  );
}
