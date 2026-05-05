"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhaseRing } from "@/components/phase-ring";
import {
  PROTOCOL_OPTIONS,
  getProtocol,
  type ProtocolSlug,
} from "@/lib/fasting/protocols";
import {
  stopFast,
  changeActiveFastProtocol,
  updateFastStartTime,
} from "@/lib/fasting/actions";
import { CheckCircle2, Pencil } from "lucide-react";

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
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [confirmingStop, setConfirmingStop] = useState(false);
  const [showProtocolPicker, setShowProtocolPicker] = useState(false);
  const [showStartEditor, setShowStartEditor] = useState(false);
  const [startTimeDraft, setStartTimeDraft] = useState(() =>
    toLocalInputValue(startedAt),
  );
  const [editError, setEditError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Resync the draft if the server-provided startedAt changes
  useEffect(() => {
    setStartTimeDraft(toLocalInputValue(startedAt));
  }, [startedAt]);

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
      router.refresh();
    });
  }

  function handleProtocolChange(slug: ProtocolSlug) {
    setShowProtocolPicker(false);
    startTransition(async () => {
      await changeActiveFastProtocol(fastId, slug);
      router.refresh();
    });
  }

  function handleSaveStartTime() {
    setEditError(null);
    const localDate = new Date(startTimeDraft);
    if (Number.isNaN(localDate.getTime())) {
      setEditError("Invalid date.");
      return;
    }
    if (localDate.getTime() > Date.now()) {
      setEditError("Start time can't be in the future.");
      return;
    }
    startTransition(async () => {
      const res = await updateFastStartTime(fastId, localDate.toISOString());
      if (!res.ok) {
        setEditError(res.error);
      } else {
        setShowStartEditor(false);
        router.refresh();
      }
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
            ? "Saving…"
            : confirmingStop
              ? "Tap again to end fast"
              : targetReached
                ? "End fast"
                : "End early"}
        </Button>

        <div className="flex w-full items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Started {formatStartedAt(startedAtMs)}</span>
          <button
            type="button"
            onClick={() => setShowStartEditor((v) => !v)}
            className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
          >
            <Pencil className="h-3 w-3" /> edit
          </button>
        </div>

        {showStartEditor && (
          <div className="w-full space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <label
              htmlFor="start-time"
              className="text-xs font-medium text-muted-foreground"
            >
              Backdate start time
            </label>
            <input
              id="start-time"
              type="datetime-local"
              value={startTimeDraft}
              onChange={(e) => setStartTimeDraft(e.target.value)}
              max={toLocalInputValue(new Date().toISOString())}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {editError && (
              <p className="text-xs text-destructive">{editError}</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={pending}
                onClick={handleSaveStartTime}
              >
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="flex-1"
                disabled={pending}
                onClick={() => {
                  setShowStartEditor(false);
                  setEditError(null);
                  setStartTimeDraft(toLocalInputValue(startedAt));
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Convert an ISO string to the format datetime-local inputs expect:
 * "YYYY-MM-DDTHH:MM" in the user's local timezone.
 */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
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
