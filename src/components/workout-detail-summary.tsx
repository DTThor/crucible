import {
  Activity,
  Bike,
  Footprints,
  Snowflake,
  Sparkles,
  Mountain,
  Waves,
  Flame,
  StickyNote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  CARDIO_MODALITY_LABELS,
  type CardioDetails,
  type CardioModality,
  type GtxDetails,
  type RecoveryDetails,
  type WorkoutDetails,
} from "@/lib/training/details";

const DIFFICULTY_ANCHORS: Record<number, string> = {
  6: "easy",
  7: "moderate",
  8: "hard",
  9: "near max",
  10: "max effort",
};

interface Props {
  type: string;
  details: WorkoutDetails | null;
}

/**
 * Read-only renderer for type-specific workout details. Used by both
 * the post-workout summary card and the history detail page. Renders
 * nothing for lift workouts (their data is in workout_sets) and for
 * empty details (`null` or `{}`).
 */
export function WorkoutDetailSummary({ type, details }: Props) {
  if (!details || Object.keys(details).length === 0) return null;

  if (type === "gtx") return <GtxSummary details={details as GtxDetails} />;
  if (type === "cardio")
    return <CardioSummary details={details as CardioDetails} />;
  if (type === "recovery")
    return <RecoverySummary details={details as RecoveryDetails} />;
  return null;
}

function GtxSummary({ details }: { details: GtxDetails }) {
  const hasContent =
    details.rpe != null ||
    (details.notes && details.notes.trim() !== "");
  if (!hasContent) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/10 p-3">
      {details.rpe != null && (
        <DifficultyRow rpe={details.rpe} />
      )}
      {details.notes && (
        <NoteRow note={details.notes} />
      )}
    </div>
  );
}

const CARDIO_ICONS: Record<CardioModality, LucideIcon> = {
  "zone2-walk": Footprints,
  run: Activity,
  bike: Bike,
  row: Waves,
  hike: Mountain,
  swim: Waves,
  other: Activity,
};

function CardioSummary({ details }: { details: CardioDetails }) {
  const Icon = details.modality ? CARDIO_ICONS[details.modality] : Activity;
  const modalityLabel = details.modality
    ? CARDIO_MODALITY_LABELS[details.modality]
    : null;

  const hasContent =
    modalityLabel ||
    details.minutes != null ||
    details.rpe != null ||
    (details.notes && details.notes.trim() !== "");
  if (!hasContent) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/10 p-3">
      {(modalityLabel || details.minutes != null) && (
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium">
            <Icon className="h-4 w-4 text-primary" />
            {modalityLabel ?? "Cardio"}
          </span>
          {details.minutes != null && (
            <span className="font-mono tabular-nums text-muted-foreground">
              {details.minutes} min
            </span>
          )}
        </div>
      )}
      {details.rpe != null && <DifficultyRow rpe={details.rpe} />}
      {details.notes && <NoteRow note={details.notes} />}
    </div>
  );
}

function RecoverySummary({ details }: { details: RecoveryDetails }) {
  const items: { icon: LucideIcon; iconColor: string; label: string; value: string }[] = [];
  if (details.sauna_min != null) {
    items.push({
      icon: Flame,
      iconColor: "text-orange-400",
      label: "Sauna",
      value: `${details.sauna_min} min`,
    });
  }
  if (details.cold_plunge_min != null) {
    items.push({
      icon: Snowflake,
      iconColor: "text-sky-400",
      label: "Cold plunge",
      value: `${details.cold_plunge_min} min`,
    });
  }
  if (details.walk_min != null) {
    const distance = details.walk_distance_mi;
    items.push({
      icon: Footprints,
      iconColor: "text-emerald-400",
      label: "Walk",
      value:
        distance != null
          ? `${details.walk_min} min · ${distance} mi`
          : `${details.walk_min} min`,
    });
  }
  if (details.mobility_min != null) {
    items.push({
      icon: Sparkles,
      iconColor: "text-violet-400",
      label: "Mobility",
      value: `${details.mobility_min} min`,
    });
  }

  if (items.length === 0 && !details.notes) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/10 p-3">
      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((it, idx) => {
            const Icon = it.icon;
            return (
              <li
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <Icon className={`h-4 w-4 ${it.iconColor}`} />
                  {it.label}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {it.value}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {details.notes && <NoteRow note={details.notes} />}
    </div>
  );
}

function DifficultyRow({ rpe }: { rpe: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Difficulty</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
        {rpe}
        {DIFFICULTY_ANCHORS[rpe] && (
          <span className="text-primary/70">· {DIFFICULTY_ANCHORS[rpe]}</span>
        )}
      </span>
    </div>
  );
}

function NoteRow({ note }: { note: string }) {
  return (
    <div className="flex items-start gap-1.5 rounded-lg bg-muted/20 px-2 py-1.5 text-xs">
      <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
      <p className="whitespace-pre-wrap text-muted-foreground">{note}</p>
    </div>
  );
}
