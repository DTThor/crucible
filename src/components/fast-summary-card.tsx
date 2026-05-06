"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Pencil, CheckCircle2 } from "lucide-react";
import { EditFastTimesModal } from "@/components/edit-fast-times-modal";
import { ConfettiBurst } from "@/components/celebration";
import { updateFastTimes } from "@/lib/fasting/actions";
import { getProtocol } from "@/lib/fasting/protocols";

interface FastSummaryCardProps {
  fastId: string;
  protocolSlug: string;
  startedAt: string;
  endedAt: string;
  status: string; // 'completed' | 'broken_early' | 'extended'
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

export function FastSummaryCard({
  fastId,
  protocolSlug,
  startedAt,
  endedAt,
  status,
}: FastSummaryCardProps) {
  const router = useRouter();
  const [localStartedAt, setLocalStartedAt] = useState(startedAt);
  const [localEndedAt, setLocalEndedAt] = useState(endedAt);
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confettiActive, setConfettiActive] = useState(false);
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);

  useEffect(() => setLocalStartedAt(startedAt), [startedAt]);
  useEffect(() => setLocalEndedAt(endedAt), [endedAt]);

  const protocol = getProtocol(protocolSlug);
  const startedMs = new Date(localStartedAt).getTime();
  const endedMs = new Date(localEndedAt).getTime();
  const durationHours = Math.max(0, (endedMs - startedMs) / 3_600_000);
  const goalReached = durationHours >= protocol.targetHours;

  // Celebrate if the completed fast hit goal
  useEffect(() => {
    if (goalReached && !hasFiredConfetti) {
      setHasFiredConfetti(true);
      setConfettiActive(true);
      const id = setTimeout(() => setConfettiActive(false), 3500);
      return () => clearTimeout(id);
    }
  }, [goalReached, hasFiredConfetti]);

  function handleSave(newStart: string, newEnd: string) {
    const previousStart = localStartedAt;
    const previousEnd = localEndedAt;
    setLocalStartedAt(newStart);
    setLocalEndedAt(newEnd);
    setEditError(null);
    startTransition(async () => {
      const res = await updateFastTimes(fastId, newStart, newEnd);
      if (!res.ok) {
        setLocalStartedAt(previousStart);
        setLocalEndedAt(previousEnd);
        setEditError(res.error);
      } else {
        setEditOpen(false);
        router.refresh();
      }
    });
  }

  function handleDone() {
    // Hard navigation forces a fresh fetch — bypasses any Next router cache
    // and any prefetched RSC payloads that might still show ActiveFastCard.
    if (typeof window !== "undefined") {
      window.location.href = "/fast";
    } else {
      router.push("/fast");
    }
  }

  const totalSeconds = Math.floor(durationHours * 3600);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);

  return (
    <>
      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                goalReached
                  ? "bg-amber-400/20 text-amber-400"
                  : "bg-primary/15 text-primary"
              }`}
            >
              {goalReached ? (
                <Trophy className="h-7 w-7" />
              ) : (
                <CheckCircle2 className="h-7 w-7" />
              )}
            </div>
            <p className="text-base font-semibold">
              {goalReached
                ? "Fast Complete!"
                : status === "broken_early"
                  ? "Fast ended early"
                  : "Fast saved"}
            </p>
            <p className="text-xs text-muted-foreground">
              {protocol.name} · {protocol.targetHours}h target
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 px-4 py-5 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Duration
            </p>
            <p className="mt-1 font-mono text-4xl font-semibold tabular-nums leading-none">
              {hh}h {mm.toString().padStart(2, "0")}m
            </p>
            {goalReached && (
              <p className="mt-1.5 text-xs font-medium text-amber-400">
                +
                {(durationHours - protocol.targetHours).toFixed(1)}h past goal
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 divide-x divide-border rounded-xl border border-border">
            <TimeCell label="Start" iso={localStartedAt} />
            <TimeCell label="End" iso={localEndedAt} alignRight />
          </div>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            disabled={pending}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-input bg-secondary py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/80"
          >
            <Pencil className="h-3 w-3" /> Adjust times
          </button>

          <button
            type="button"
            onClick={handleDone}
            disabled={pending}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </CardContent>
      </Card>

      <EditFastTimesModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditError(null);
        }}
        onSave={handleSave}
        initialStartedAtIso={localStartedAt}
        initialEndedAtIso={localEndedAt}
        pending={pending}
        error={editError}
      />

      <ConfettiBurst active={confettiActive} />
    </>
  );
}

function TimeCell({
  label,
  iso,
  alignRight,
}: {
  label: string;
  iso: string;
  alignRight?: boolean;
}) {
  const d = new Date(iso);
  const date = `${WEEKDAY_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
  const time = `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  return (
    <div
      className={`px-4 py-3 ${alignRight ? "text-right" : "text-left"}`}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium tabular-nums">
        {date} · {time}
      </p>
    </div>
  );
}
