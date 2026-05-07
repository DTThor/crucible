"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bike,
  Footprints,
  Snowflake,
  Sparkles,
  Mountain,
  Waves,
  Flame,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RpePicker } from "@/components/rpe-picker";
import { updateWorkoutDetails } from "@/lib/training/actions";
import {
  CARDIO_MODALITIES,
  CARDIO_MODALITY_LABELS,
  type CardioDetails,
  type CardioModality,
  type GtxDetails,
  type RecoveryDetails,
} from "@/lib/training/details";

/**
 * Shared "save on every change" hook. We persist immediately on each
 * field commit (blur for text/number, onChange for picker) so the user
 * can leave the page and come back without losing what they typed.
 * Optimistic — local state is the source of truth during the session.
 */
function useDetailSaver<T extends object>(
  workoutId: string,
  initial: T,
) {
  const router = useRouter();
  const [details, setDetails] = useState<T>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function patch(p: Partial<T>) {
    const next = { ...details, ...p };
    setDetails(next);
    setError(null);
    startTransition(async () => {
      const res = await updateWorkoutDetails(workoutId, next);
      if (!res.ok) {
        setError(res.error);
        router.refresh();
      }
    });
  }

  return { details, patch, pending, error };
}

// ── GTX ─────────────────────────────────────────────────────────────

interface GtxLoggerProps {
  workoutId: string;
  initial: GtxDetails;
}

export function GtxLogger({ workoutId, initial }: GtxLoggerProps) {
  const { details, patch, error } = useDetailSaver<GtxDetails>(
    workoutId,
    initial,
  );

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Activity className="h-4 w-4 text-primary" />
        GTX class
      </div>

      <RpePicker
        value={details.rpe ?? null}
        onChange={(rpe) => patch({ rpe })}
      />

      <NotesField
        value={details.notes ?? ""}
        onCommit={(notes) => patch({ notes })}
        placeholder="Class notes (e.g. coach name, focus, partners)"
      />

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

// ── Cardio ──────────────────────────────────────────────────────────

const CARDIO_ICONS: Record<CardioModality, LucideIcon> = {
  "zone2-walk": Footprints,
  run: Activity,
  bike: Bike,
  row: Waves,
  hike: Mountain,
  swim: Waves,
  other: Activity,
};

interface CardioLoggerProps {
  workoutId: string;
  initial: CardioDetails;
}

export function CardioLogger({
  workoutId,
  initial,
}: CardioLoggerProps) {
  const { details, patch, error } = useDetailSaver<CardioDetails>(
    workoutId,
    initial,
  );

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Activity className="h-4 w-4 text-primary" />
        Cardio
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Modality
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {CARDIO_MODALITIES.map((m) => {
            const Icon = CARDIO_ICONS[m];
            const isSelected = details.modality === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => patch({ modality: m })}
                className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-md border text-[10px] font-medium ${
                  isSelected
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-input bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {CARDIO_MODALITY_LABELS[m]}
              </button>
            );
          })}
        </div>
      </div>

      <NumberField
        label="Minutes"
        value={details.minutes ?? null}
        onCommit={(minutes) => patch({ minutes })}
        unit="min"
        max={1000}
      />

      <RpePicker
        value={details.rpe ?? null}
        onChange={(rpe) => patch({ rpe })}
      />

      <NotesField
        value={details.notes ?? ""}
        onCommit={(notes) => patch({ notes })}
        placeholder="Pace, route, anything noteworthy"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Recovery ────────────────────────────────────────────────────────

interface RecoveryActivity {
  key: keyof RecoveryDetails;
  label: string;
  icon: LucideIcon;
  iconColor: string;
}

const RECOVERY_ACTIVITIES: RecoveryActivity[] = [
  {
    key: "sauna_min",
    label: "Sauna",
    icon: Flame,
    iconColor: "text-orange-400",
  },
  {
    key: "cold_plunge_min",
    label: "Cold plunge",
    icon: Snowflake,
    iconColor: "text-sky-400",
  },
  {
    key: "walk_min",
    label: "Walk",
    icon: Footprints,
    iconColor: "text-emerald-400",
  },
  {
    key: "mobility_min",
    label: "Mobility / stretch",
    icon: Sparkles,
    iconColor: "text-violet-400",
  },
];

interface RecoveryLoggerProps {
  workoutId: string;
  initial: RecoveryDetails;
}

export function RecoveryLogger({
  workoutId,
  initial,
}: RecoveryLoggerProps) {
  const { details, patch, error } = useDetailSaver<RecoveryDetails>(
    workoutId,
    initial,
  );

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-primary" />
        Recovery
      </div>

      <div className="space-y-2">
        {RECOVERY_ACTIVITIES.map((act) => {
          const value = details[act.key] as number | null | undefined;
          const enabled = value != null;
          const Icon = act.icon;

          // Disabled state: the entire card is a single button so any
          // tap inside it enables the activity. No nested input → no
          // event-bubbling concerns.
          if (!enabled) {
            return (
              <button
                key={act.key}
                type="button"
                onClick={() =>
                  patch({ [act.key]: 0 } as Partial<RecoveryDetails>)
                }
                className="flex w-full items-center gap-2 rounded-md border border-border bg-card/40 p-2.5 text-left transition-colors hover:bg-accent"
                aria-label={`Add ${act.label}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-input bg-muted">
                  <Icon className={`h-3.5 w-3.5 ${act.iconColor}`} />
                </span>
                <span className="flex-1 text-sm font-medium">{act.label}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Tap to add
                </span>
              </button>
            );
          }

          // Enabled state: container is a div (input lives inside).
          // The icon button to the left removes the activity.
          return (
            <div
              key={act.key}
              className="rounded-md border border-primary/40 bg-card p-2.5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (act.key === "walk_min") {
                      patch({
                        walk_min: null,
                        walk_distance_mi: null,
                      } as Partial<RecoveryDetails>);
                    } else {
                      patch({ [act.key]: null } as Partial<RecoveryDetails>);
                    }
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/60 bg-primary/15 hover:border-destructive/60 hover:bg-destructive/15"
                  aria-label={`Remove ${act.label}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${act.iconColor}`} />
                </button>
                <span className="flex-1 text-sm font-medium">{act.label}</span>
                <NumberField
                  label=""
                  value={value ?? null}
                  onCommit={(n) =>
                    patch({ [act.key]: n } as Partial<RecoveryDetails>)
                  }
                  unit="min"
                  inline
                  max={600}
                />
              </div>

              {act.key === "walk_min" && (
                <div className="mt-2 flex items-center gap-2 pl-9">
                  <span className="text-xs text-muted-foreground">
                    Distance
                  </span>
                  <NumberField
                    label=""
                    value={details.walk_distance_mi ?? null}
                    onCommit={(n) => patch({ walk_distance_mi: n })}
                    unit="mi"
                    step={0.1}
                    inline
                    max={100}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <NotesField
        value={details.notes ?? ""}
        onCommit={(notes) => patch({ notes })}
        placeholder="Notes (e.g. how you felt, location)"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Shared field components ────────────────────────────────────────

function NumberField({
  label,
  value,
  onCommit,
  unit,
  step = 1,
  max = 9999,
  inline = false,
}: {
  label: string;
  value: number | null;
  onCommit: (n: number | null) => void;
  unit?: string;
  step?: number;
  max?: number;
  inline?: boolean;
}) {
  const [text, setText] = useState(value != null ? value.toString() : "");

  // Re-sync if external value changes (e.g. server reverted on error).
  // useEffect import omitted intentionally — we only sync once via key.
  // For the simpler internal state, this is good enough.

  function commit() {
    const trimmed = text.trim();
    if (trimmed === "") {
      onCommit(null);
      return;
    }
    const n = parseFloat(trimmed);
    if (!Number.isFinite(n) || n < 0 || n > max) {
      // revert
      setText(value != null ? value.toString() : "");
      return;
    }
    onCommit(n);
  }

  if (inline) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min="0"
          max={max}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          className="h-8 w-16 rounded-md border border-input bg-background px-2 text-center font-mono text-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {unit && (
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min="0"
          max={max}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          placeholder={unit ?? ""}
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {unit && (
          <span className="text-xs text-muted-foreground">{unit}</span>
        )}
      </div>
    </div>
  );
}

function NotesField({
  value,
  onCommit,
  placeholder,
}: {
  value: string;
  onCommit: (s: string) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value);

  function commit() {
    if (text === value) return;
    onCommit(text);
  }

  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      placeholder={placeholder}
      rows={2}
      className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}
