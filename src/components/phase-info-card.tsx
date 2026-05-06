"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Modal } from "@/components/modal";
import { getPhaseIcon, type Phase } from "@/lib/fasting/phases";

interface PhaseInfoCardProps {
  phase: Phase;
}

export function PhaseInfoCard({ phase }: PhaseInfoCardProps) {
  const [open, setOpen] = useState(false);
  const Icon = getPhaseIcon(phase);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:bg-accent"
        style={{ borderColor: `color-mix(in srgb, ${phase.color} 35%, transparent)` }}
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `color-mix(in srgb, ${phase.color} 18%, transparent)` }}
        >
          <Icon size={22} style={{ color: phase.color }} strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold" style={{ color: phase.color }}>
            {phase.name}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {phase.blurb}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `color-mix(in srgb, ${phase.color} 18%, transparent)` }}
          >
            <Icon size={22} style={{ color: phase.color }} strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: phase.color }}>
              {phase.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              Hours {phase.fromHours}–{phase.toHours}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-foreground/90">
          {phase.description}
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-5 w-full rounded-md border border-input bg-background py-2 text-sm font-medium hover:bg-accent"
        >
          Close
        </button>
      </Modal>
    </>
  );
}
