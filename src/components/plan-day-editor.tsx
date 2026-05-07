"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Activity,
  Sparkles,
  Coffee,
  RotateCcw,
} from "lucide-react";
import { Modal } from "@/components/modal";
import {
  setPlannedDay,
  clearPlannedDay,
} from "@/lib/planning/actions";
import {
  ratePairing,
  recommendedFast,
  recommendedWorkout,
  type PairingLevel,
} from "@/lib/planning/coaching";
import { dayOfMonthFromIso, monthFromIso } from "@/lib/tz";
import {
  WORKOUT_TEMPLATES,
  type WorkoutType,
} from "@/lib/training/templates";
import {
  PROTOCOL_OPTIONS,
  type ProtocolSlug,
} from "@/lib/fasting/protocols";
import type { PlannedDay } from "@/lib/planning/types";

interface PlanDayEditorProps {
  day: PlannedDay | null;
  onClose: () => void;
}

interface WorkoutOption {
  type: WorkoutType;
  templateSlug?: string;
  label: string;
  sublabel?: string;
}

const WORKOUT_OPTIONS: WorkoutOption[] = [
  { type: "rest", label: "Rest", sublabel: "Sleep, mobility, sauna" },
  { type: "gtx", label: "GTX class", sublabel: "Group training class" },
  ...Object.values(WORKOUT_TEMPLATES).map((t) => ({
    type: "lift" as WorkoutType,
    templateSlug: t.slug,
    label: t.name,
    sublabel: `Lift · ${t.durationTargetMin}-min`,
  })),
  { type: "cardio", label: "Cardio", sublabel: "Run, bike, hike, row" },
  {
    type: "recovery",
    label: "Recovery",
    sublabel: "Sauna, cold plunge, walk",
  },
];

const WORKOUT_ICONS = {
  lift: Dumbbell,
  gtx: Activity,
  cardio: Activity,
  recovery: Sparkles,
  rest: Coffee,
} as const;

const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
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

function formatLongDate(day: { dayOfWeek: number; dateIso: string }): string {
  return `${WEEKDAY_LONG[day.dayOfWeek]}, ${MONTH_SHORT[monthFromIso(day.dateIso)]} ${dayOfMonthFromIso(day.dateIso)}`;
}

export function PlanDayEditor({ day, onClose }: PlanDayEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Local working copy so the user can flip between options without
  // hitting the server until they tap Save.
  const [workoutType, setWorkoutType] = useState<WorkoutType>("rest");
  const [templateSlug, setTemplateSlug] = useState<string | null>(null);
  const [fastingSlug, setFastingSlug] = useState<ProtocolSlug>("16:8");

  // Re-init when the editor opens with a different day.
  useEffect(() => {
    if (!day) return;
    setError(null);
    setWorkoutType(day.workoutType);
    setTemplateSlug(day.workoutTemplateSlug);
    setFastingSlug(day.fastingProtocolSlug);
  }, [day]);

  function handleSave() {
    if (!day) return;
    setError(null);
    startTransition(async () => {
      const res = await setPlannedDay(day.dateIso, {
        workoutType,
        workoutTemplateSlug:
          workoutType === "lift" ? templateSlug : null,
        fastingProtocolSlug: fastingSlug,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  function handleResetToDefault() {
    if (!day) return;
    setError(null);
    startTransition(async () => {
      const res = await clearPlannedDay(day.dateIso);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  // Pick the option key to use for the workout picker. Lift options
  // are unique by templateSlug; non-lift by type.
  function isCurrentWorkout(opt: WorkoutOption): boolean {
    if (opt.type === "lift") {
      return workoutType === "lift" && templateSlug === opt.templateSlug;
    }
    return workoutType === opt.type;
  }

  return (
    <Modal
      open={day != null}
      onClose={onClose}
      className="max-w-md"
    >
      {day && (
        <>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">
                Plan for {formatLongDate(day)}
              </h2>
              {day.isOverridden && (
                <p className="text-[11px] text-muted-foreground">
                  Currently overridden — recurring default would be{" "}
                  {workoutTypeDisplay(day.dayOfWeek)}.
                </p>
              )}
            </div>
          </div>

          <section className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Workout
            </p>
            <div className="grid grid-cols-1 gap-1.5 max-h-[40vh] overflow-y-auto">
              {WORKOUT_OPTIONS.map((opt) => {
                const Icon = WORKOUT_ICONS[opt.type];
                const selected = isCurrentWorkout(opt);
                return (
                  <button
                    key={`${opt.type}:${opt.templateSlug ?? ""}`}
                    type="button"
                    onClick={() => {
                      setWorkoutType(opt.type);
                      setTemplateSlug(opt.templateSlug ?? null);
                    }}
                    className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-sm transition-colors ${
                      selected
                        ? "border-primary bg-primary/15"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        selected
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="truncate font-medium">{opt.label}</p>
                      {opt.sublabel && (
                        <p className="truncate text-[10px] text-muted-foreground">
                          {opt.sublabel}
                        </p>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Fasting protocol
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {PROTOCOL_OPTIONS.map((p) => {
                const selected = fastingSlug === p.slug;
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => setFastingSlug(p.slug)}
                    className={`flex flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-2 transition-colors ${
                      selected
                        ? "border-primary bg-primary/15"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    <span className="text-sm font-semibold">{p.name}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {p.targetHours}h
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <PairingCoaching
            workoutType={workoutType}
            fastingSlug={fastingSlug}
          />

          {error && (
            <p className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save plan"}
            </button>
            {day.isOverridden && (
              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={pending}
                className="flex w-full items-center justify-center gap-1.5 rounded-full border border-input bg-secondary py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/80 disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to weekday default
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="w-full rounded-full py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

/**
 * Coaching block — explains the current pairing and surfaces warnings
 * with a colored band based on the pairing level. Updates live as the
 * user toggles workout / fast options in the editor.
 */
function PairingCoaching({
  workoutType,
  fastingSlug,
}: {
  workoutType: import("@/lib/training/templates").WorkoutType;
  fastingSlug: import("@/lib/fasting/protocols").ProtocolSlug;
}) {
  const rating = ratePairing(workoutType, fastingSlug);
  const styles = STYLE_BY_LEVEL[rating.level];
  const recFast = recommendedFast(workoutType);
  const recWorkout = recommendedWorkout(fastingSlug);
  const showSwapHint =
    rating.level === "avoid" || rating.level === "caution";

  return (
    <div
      className={`mt-4 rounded-lg border ${styles.border} ${styles.bg} p-3`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider ${styles.text}`}
        >
          {styles.label}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-foreground/90">
        {rating.reason}
      </p>
      {showSwapHint && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Suggested: pair this fast with{" "}
          <span className="font-semibold">{labelWorkout(recWorkout)}</span>, or
          this workout with a{" "}
          <span className="font-semibold">{recFast}</span> fast.
        </p>
      )}
    </div>
  );
}

const STYLE_BY_LEVEL: Record<
  PairingLevel,
  { label: string; bg: string; border: string; text: string }
> = {
  great: {
    label: "Great pairing",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
  },
  ok: {
    label: "Workable",
    bg: "bg-muted/40",
    border: "border-border",
    text: "text-muted-foreground",
  },
  caution: {
    label: "Heads up",
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    text: "text-amber-400",
  },
  avoid: {
    label: "Bad combo",
    bg: "bg-destructive/10",
    border: "border-destructive/40",
    text: "text-destructive",
  },
};

function labelWorkout(
  t: import("@/lib/training/templates").WorkoutType,
): string {
  switch (t) {
    case "lift":
      return "Lift";
    case "gtx":
      return "GTX class";
    case "cardio":
      return "Cardio";
    case "recovery":
      return "Recovery";
    case "rest":
      return "Rest";
  }
}

function workoutTypeDisplay(dow: number): string {
  // Used only for the small "currently overridden" line — show what
  // the recurring default would be for context.
  // Imports of DEFAULT_TRAINING_WEEK kept inline to avoid client-side
  // server module pulls.
  const names: Record<number, string> = {
    0: "Rest",
    1: "GTX class",
    2: "Lift (upper)",
    3: "Recovery",
    4: "GTX class",
    5: "Lift (lower)",
    6: "Cardio",
  };
  return names[dow] ?? "default";
}
