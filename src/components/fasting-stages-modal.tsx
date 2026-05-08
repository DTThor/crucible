"use client";

import { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import {
  PHASES,
  getPhaseIcon,
  type Phase,
  type PhaseSlug,
} from "@/lib/fasting/phases";

interface FastingStagesModalProps {
  open: boolean;
  onClose: () => void;
  /** Current phase the user is in — gets the "Active" pill. */
  currentSlug?: PhaseSlug;
}

/**
 * Full-screen modal that renders every fasting phase end-to-end.
 * Designed to feel like a reference page rather than a chat-style
 * popover — sticky header, scrollable body, color-coded sections by
 * phase. Active pill marks where the current fast lives in the
 * timeline.
 */
export function FastingStagesModal({
  open,
  onClose,
  currentSlug,
}: FastingStagesModalProps) {
  // Lock body scroll + close on Escape, same primitives as Modal.tsx.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fasting-stages-title"
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      {/* Sticky header */}
      <header
        className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-background/95 px-4 py-4 backdrop-blur"
        style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
      >
        <div className="min-w-0">
          <h1
            id="fasting-stages-title"
            className="text-xl font-bold leading-tight"
          >
            Fasting Stages
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            What your body is doing — and why it matters
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Scrollable body */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
      >
        <ul className="space-y-3">
          {PHASES.map((phase) => (
            <li key={phase.slug}>
              <PhaseSection
                phase={phase}
                isActive={phase.slug === currentSlug}
              />
            </li>
          ))}
        </ul>

        <p className="mt-6 px-1 text-[10px] leading-relaxed text-muted-foreground">
          This is general physiological information drawn from peer-reviewed
          research and clinical work, not medical advice. Multi-day fasts are
          a medical intervention; talk to a doctor before fasting beyond
          24-48 hours, especially with existing conditions or medications.
        </p>
      </div>
    </div>
  );
}

function PhaseSection({
  phase,
  isActive,
}: {
  phase: Phase;
  isActive: boolean;
}) {
  const Icon = getPhaseIcon(phase);
  return (
    <article
      className="overflow-hidden rounded-2xl border bg-card"
      style={{
        borderColor: `color-mix(in srgb, ${phase.color} 35%, transparent)`,
      }}
    >
      {/* Color rail down the left edge */}
      <div className="flex">
        <div
          className="w-1 shrink-0"
          style={{ backgroundColor: phase.color }}
          aria-hidden
        />
        <div className="min-w-0 flex-1 px-4 py-4">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `color-mix(in srgb, ${phase.color} 18%, transparent)`,
              }}
            >
              <Icon
                size={20}
                style={{ color: phase.color }}
                strokeWidth={2.25}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h2 className="text-base font-bold leading-tight">
                  {phase.name}
                </h2>
                {isActive && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${phase.color} 22%, transparent)`,
                      color: phase.color,
                    }}
                  >
                    Active
                  </span>
                )}
              </div>
              <p
                className="font-mono text-xs tabular-nums"
                style={{ color: phase.color }}
              >
                {formatRange(phase.fromHours, phase.toHours)}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">
            {phase.description}
          </p>

          {/* What's happening */}
          <Section
            label="What's happening"
            color={phase.color}
            items={phase.whatsHappening}
          />

          {/* Benefits */}
          {phase.benefits.length > 0 && (
            <Section
              label="Benefits"
              color={phase.color}
              items={phase.benefits}
            />
          )}

          {/* Cautions (only for long phases) */}
          {phase.cautions && phase.cautions.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                Cautions
              </div>
              <ul className="space-y-1.5">
                {phase.cautions.map((c, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-xs leading-relaxed text-foreground/85"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-amber-400"
                    />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Research citations */}
          <div className="mt-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Research
            </p>
            <ul className="space-y-1">
              {phase.research.map((r, i) => (
                <li
                  key={i}
                  className="text-[11px] italic leading-relaxed text-muted-foreground"
                >
                  {r.citation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

function Section({
  label,
  color,
  items,
}: {
  label: string;
  color: string;
  items: string[];
}) {
  return (
    <div className="mt-4">
      <p
        className="mb-1.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ color }}
      >
        {label}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2 text-xs leading-relaxed text-foreground/85"
          >
            <span
              aria-hidden
              className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatRange(from: number, to: number): string {
  if (to >= 240) return `${from}h+`;
  return `${from}h – ${to}h`;
}
