/**
 * Physiological phases of a fast, anchored in Dr. Jason Fung's framework
 * (The Obesity Code, The Complete Guide to Fasting). Hours are elapsed time
 * since the user's last meal.
 */
export type PhaseSlug =
  | "fed"
  | "early"
  | "glycogen"
  | "switch"
  | "ketosis"
  | "autophagy"
  | "extended";

export interface Phase {
  slug: PhaseSlug;
  name: string;
  short: string;
  fromHours: number;
  toHours: number;
  /** CSS-ready color string. Used directly in inline styles. */
  color: string;
  description: string;
}

export const PHASES: Phase[] = [
  {
    slug: "fed",
    name: "Fed / Anabolic",
    short: "Fed",
    fromHours: 0,
    toHours: 4,
    color: "hsl(215 16% 47%)", // slate
    description:
      "Insulin elevated. Glucose from your last meal is fueling cells; excess goes to glycogen and fat stores. Fat-burning is suppressed.",
  },
  {
    slug: "early",
    name: "Early fasting",
    short: "Early",
    fromHours: 4,
    toHours: 12,
    color: "hsl(217 91% 60%)", // blue
    description:
      "Insulin falling. Liver glycogen begins mobilizing to keep blood glucose stable. Metabolism shifting toward maintenance.",
  },
  {
    slug: "glycogen",
    name: "Glycogen depletion",
    short: "Glycogen",
    fromHours: 12,
    toHours: 16,
    color: "hsl(173 80% 40%)", // teal
    description:
      "Glycogen tank running low. Body preparing to switch fuels. Hunger often spikes here, then passes.",
  },
  {
    slug: "switch",
    name: "Metabolic switch",
    short: "Switch",
    fromHours: 16,
    toHours: 24,
    color: "hsl(142 71% 45%)", // green
    description:
      "Lipolysis ramps up. Ketones begin to rise. Autophagy initiating — cellular cleanup starts. This is where most of the daily IF benefits live.",
  },
  {
    slug: "ketosis",
    name: "Ketosis + GH surge",
    short: "Ketosis",
    fromHours: 24,
    toHours: 36,
    color: "hsl(38 92% 50%)", // amber
    description:
      "Meaningful ketosis. Growth hormone ~5× baseline (preserves lean mass). Autophagy fully active. Mental clarity often peaks.",
  },
  {
    slug: "autophagy",
    name: "Deep autophagy",
    short: "Autophagy",
    fromHours: 36,
    toHours: 48,
    color: "hsl(20 90% 50%)", // orange
    description:
      "Cellular cleanup peaking. Damaged proteins recycled. Immune cell turnover. Deep fat oxidation. Where 36-hour fasts pay off.",
  },
  {
    slug: "extended",
    name: "Extended fast",
    short: "Extended",
    fromHours: 48,
    toHours: 72,
    color: "hsl(0 84% 60%)", // red
    description:
      "Sustained ketosis. Salt + electrolytes recommended (Fung specifically endorses bone broth for fasts beyond 36h).",
  },
];

/** Find the phase the user is currently in, given elapsed hours. */
export function getCurrentPhase(elapsedHours: number): Phase {
  if (elapsedHours < 0) return PHASES[0];
  return (
    PHASES.find(
      (p) => elapsedHours >= p.fromHours && elapsedHours < p.toHours,
    ) ?? PHASES[PHASES.length - 1]
  );
}

/** Hours until the next phase boundary, or null if past the last phase. */
export function hoursUntilNextPhase(elapsedHours: number): number | null {
  const current = getCurrentPhase(elapsedHours);
  if (current.slug === "extended") return null;
  return current.toHours - elapsedHours;
}
