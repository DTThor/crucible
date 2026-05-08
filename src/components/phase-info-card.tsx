"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { FastingStagesModal } from "@/components/fasting-stages-modal";
import { getPhaseIcon, type Phase } from "@/lib/fasting/phases";

interface PhaseInfoCardProps {
  phase: Phase;
}

/**
 * Compact "current phase" card on the active fast view. Tap → opens
 * the full Fasting Stages reference (every phase, with research
 * citations and the user's current phase pre-flagged "Active").
 */
export function PhaseInfoCard({ phase }: PhaseInfoCardProps) {
  const [open, setOpen] = useState(false);
  const Icon = getPhaseIcon(phase);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors hover:bg-accent"
        style={{
          borderColor: `color-mix(in srgb, ${phase.color} 35%, transparent)`,
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: `color-mix(in srgb, ${phase.color} 18%, transparent)`,
          }}
        >
          <Icon size={18} style={{ color: phase.color }} strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold leading-tight"
            style={{ color: phase.color }}
          >
            {phase.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {phase.blurb}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      <FastingStagesModal
        open={open}
        onClose={() => setOpen(false)}
        currentSlug={phase.slug}
      />
    </>
  );
}
