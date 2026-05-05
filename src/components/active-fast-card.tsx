"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhaseRing } from "@/components/phase-ring";
import {
  PROTOCOL_OPTIONS,
  getProtocol,
  type ProtocolSlug,
} from "@/lib/fasting/protocols";
import { stopFast, changeActiveFastProtocol } from "@/lib/fasting/actions";
import { CheckCircle2 } from "lucide-react";

interface ActiveFastCardProps {
  fastId: string;
  protocolSlug: string;
  startedAt: string; // ISO timestamp
}

export function ActiveFastCard({
  fastId,
  protocolSlug,
  startedAt,
}: ActiveFastCardProps) {
  const [now, setNow] = useState(() => Date.now());
  const [confirmingStop, setConfirmingStop] = useState(false);
  const [showProtocolPicker, setShowProtocolPicker] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-cancel stop confirmation after 5s
  useEffect(() => {
    if (!confirmingStop) return;
    const id = setTimeout(() => setConfirmingStop(false), 5000);
    return () => clearTimeout(id);
  }, [confirmingStop]);

  const startedAtMs = new Date(startedAt).getTime();
  const elapsedHours = Math.max(0, (now - startedAtMs) / 3_600_000);
  const protocol = getProtocol(protocolSlug);
  const targetReached = elapsedHours >= protocol.targetHours;
  const overshoot = Math.max(0, elapsedHours - protocol.targetHours);

  function handleStop() {
    if (!confirmingStop) {
      setConfirmingStop(true);
      return;
    }
    startTransition(async () => {
      const reason = targetReached ? "completed" : "broken_early";
      await stopFast(fastId, reason);
    });
  }

  function handleProtocolChange(slug: ProtocolSlug) {
    setShowProtocolPicker(false);
    startTransition(async () => {
      await changeActiveFastProtocol(fastId, slug);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-8">
        <PhaseRing
          elapsedHours={elapsedHours}
          targetHours={protocol.targetHours}
        />

        {targetReached && (
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Goal reached
              {overshoot > 0.05
                ? ` · +${formatOvershoot(overshoot)} past target`
                : ""}
            </span>
          </div>
        )}

        <div className="w-full text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Protocol
          </p>
          <button
            type="button"
            onClick={() => setShowProtocolPicker((v) => !v)}
            className="mt-1 text-base font-medium underline-offset-4 hover:underline"
          >
            {protocol.name} · {protocol.targetHours}h target
          </button>
        </div>

        {showProtocolPicker && (
          <div className="grid w-full grid-cols-3 gap-2">
            {PROTOCOL_OPTIONS.map((p) => {
              const isCurrent = p.slug === protocolSlug;
              return (
                <button
                  key={p.slug}
                  type="button"
                  disabled={pending}
                  onClick={() => handleProtocolChange(p.slug)}
                  className={`rounded-lg border px-2 py-3 text-sm font-medium transition-colors ${
                    isCurrent
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}

        <Button
          variant={confirmingStop ? "destructive" : "outline"}
          size="lg"
          className="w-full"
          disabled={pending}
          onClick={handleStop}
        >
          {pending
            ? "Ending…"
            : confirmingStop
              ? "Tap again to end fast"
              : targetReached
                ? "End fast"
                : "End early"}
        </Button>

        <p className="text-xs text-muted-foreground">
          Started {formatStartedAt(startedAtMs)}
        </p>
      </CardContent>
    </Card>
  );
}

function formatStartedAt(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return sameDay
    ? `today at ${time}`
    : `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} at ${time}`;
}

function formatOvershoot(hours: number): string {
  const totalMinutes = Math.floor(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}
