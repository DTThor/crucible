"use client";

import { Modal } from "@/components/modal";
import { Dumbbell, Activity, Sparkles } from "lucide-react";
import type { WorkoutType } from "@/lib/training/templates";

interface WorkoutTypePickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (type: WorkoutType, templateSlug?: string) => void;
  pending?: boolean;
  /** The day's prescribed type, highlighted as recommended. */
  recommendedType?: WorkoutType;
  recommendedTemplateSlug?: string;
}

interface Option {
  type: WorkoutType;
  templateSlug?: string;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const OPTIONS: Option[] = [
  {
    type: "lift",
    templateSlug: "upper_body_db",
    title: "Lift — Upper body DB",
    subtitle: "4 exercises · 30 min",
    Icon: Dumbbell,
  },
  {
    type: "lift",
    templateSlug: "lower_kb_focus",
    title: "Lift — Lower body KB",
    subtitle: "4 exercises · 30 min",
    Icon: Dumbbell,
  },
  {
    type: "lift",
    templateSlug: "full_body_kb",
    title: "Lift — Full body KB",
    subtitle: "4 exercises · 30 min",
    Icon: Dumbbell,
  },
  {
    type: "gtx",
    title: "GTX class",
    subtitle: "Group class — log overall RPE",
    Icon: Activity,
  },
  {
    type: "cardio",
    title: "Cardio",
    subtitle: "Zone-2 or HIIT",
    Icon: Activity,
  },
  {
    type: "recovery",
    title: "Recovery",
    subtitle: "Walk + sauna + mobility",
    Icon: Sparkles,
  },
];

export function WorkoutTypePicker({
  open,
  onClose,
  onPick,
  pending,
  recommendedType,
  recommendedTemplateSlug,
}: WorkoutTypePickerProps) {
  function isRecommended(opt: Option): boolean {
    if (opt.type !== recommendedType) return false;
    if (opt.type === "lift") {
      return opt.templateSlug === recommendedTemplateSlug;
    }
    return true;
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-center text-base font-semibold">Choose a workout</h2>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        You can pick anything — today's plan is just a suggestion.
      </p>
      <div className="mt-4 space-y-2">
        {OPTIONS.map((opt, idx) => {
          const recommended = isRecommended(opt);
          return (
            <button
              key={idx}
              type="button"
              disabled={pending}
              onClick={() => onPick(opt.type, opt.templateSlug)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                recommended
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  recommended ? "bg-primary/20" : "bg-muted"
                }`}
              >
                <opt.Icon
                  className={`h-4 w-4 ${
                    recommended ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{opt.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {opt.subtitle}
                </p>
              </div>
              {recommended && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  today's plan
                </span>
              )}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-full border border-input bg-secondary py-2.5 text-sm font-medium hover:bg-secondary/80"
      >
        Cancel
      </button>
    </Modal>
  );
}
