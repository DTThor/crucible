/**
 * Physiological phases of a fast, anchored in Dr. Jason Fung's framework
 * (The Obesity Code, The Complete Guide to Fasting, The Cancer Code) and
 * the broader research literature — Longo, Mattson, Cahill, Mizushima.
 *
 * Hours are elapsed time since the user's last meal. The timeline runs
 * out past 120h to cover prolonged-fast territory. Boundaries are
 * approximate — actual transitions depend on body composition,
 * activity, and prior metabolic flexibility.
 */
export type PhaseSlug =
  | "fed"
  | "early"
  | "glycogen"
  | "switch"
  | "ketosis"
  | "autophagy"
  | "extended"
  | "stem_cell"
  | "deep_regen"
  | "prolonged";

export interface PhaseResearch {
  citation: string;
}

export interface Phase {
  slug: PhaseSlug;
  name: string;
  short: string;
  fromHours: number;
  toHours: number;
  /** CSS-ready color string. Used directly in inline styles. */
  color: string;
  /** Lucide icon name to render at this phase's boundary on the ring. */
  iconName:
    | "ShieldCheck"
    | "Leaf"
    | "Flame"
    | "RefreshCw"
    | "Zap"
    | "Sparkles"
    | "Heart"
    | "Activity"
    | "Atom"
    | "Crown";
  /** One-line summary used in card subtitles + the ring tooltip. */
  blurb: string;
  /** Two-or-three-sentence overview shown at the top of each section. */
  description: string;
  /** Detailed bullets — what the body is actually doing. */
  whatsHappening: string[];
  /** Practical wins for the user. */
  benefits: string[];
  /** Optional safety / caution notes — surfaced for the long phases. */
  cautions?: string[];
  /** Research citations the section is drawn from. */
  research: PhaseResearch[];
}

export const PHASES: Phase[] = [
  {
    slug: "fed",
    name: "Fed / Anabolic",
    short: "Fed",
    fromHours: 0,
    toHours: 4,
    color: "hsl(215 20% 70%)",
    iconName: "ShieldCheck",
    blurb: "Digesting your last meal. Insulin elevated.",
    description:
      "Body is in storage mode — incoming nutrients are absorbed and either burned or stockpiled. Insulin is the dominant hormone here, signaling cells to take up glucose and fat-burning to stand down.",
    whatsHappening: [
      "Insulin elevated — turns on storage pathways, suppresses fat burning",
      "Glucose from your meal fuels cells; excess stored as glycogen (liver + muscle)",
      "Once glycogen tanks are full, surplus carbs convert to triglycerides via DNL",
      "Digestion + nutrient absorption is the dominant process",
      "Lipolysis (fat breakdown) is suppressed — you can't burn fat in a high-insulin state",
    ],
    benefits: [
      "Refueling depleted glycogen after exercise",
      "Protein synthesis window post-workout (insulin + amino acids → muscle)",
      "Replenishing micronutrients",
    ],
    research: [
      { citation: "Cahill GF Jr. — Annual Review of Nutrition, 2006" },
      {
        citation:
          "Petersen KF et al. — \"The role of skeletal muscle insulin resistance,\" Diabetes, 2007",
      },
    ],
  },
  {
    slug: "early",
    name: "Early Fasting",
    short: "Early",
    fromHours: 4,
    toHours: 12,
    color: "hsl(142 76% 56%)",
    iconName: "Leaf",
    blurb: "Blood sugar normalizing. Glycogen reserves depleting.",
    description:
      "Insulin is dropping. The body shifts from absorbing food to mobilizing its own stores — first glycogen, then a slow ramp-up of fat oxidation. Most people don't feel this transition; it's the standard overnight fast.",
    whatsHappening: [
      "Insulin levels falling toward baseline",
      "Glucagon rises — counter-regulatory hormone that mobilizes stored fuel",
      "Liver releases glycogen to keep blood glucose stable",
      "Muscles start using fatty acids for fuel; brain still on glucose",
      "Digestive system at rest — gut motility slows",
    ],
    benefits: [
      "Insulin levels fall — fat-storage signal weakens",
      "Blood sugar stabilizes via glycogen release",
      "Digestive system gets a rest — reduces bloating and inflammation",
      "Mild improvements in mental clarity once fully digested",
      "GLP-1 + leptin sensitivity start to recover",
    ],
    research: [
      { citation: "Cahill GF Jr. — Annual Review of Nutrition, 2006" },
      {
        citation:
          "Heilbronn LK et al. — \"Alternate-day fasting in nonobese subjects,\" American Journal of Clinical Nutrition, 2005",
      },
      {
        citation:
          "Longo VD & Mattson MP — \"Fasting: Molecular Mechanisms and Clinical Applications,\" Cell Metabolism, 2014",
      },
    ],
  },
  {
    slug: "glycogen",
    name: "Glycogen Depletion",
    short: "Glycogen",
    fromHours: 12,
    toHours: 16,
    color: "hsl(173 80% 55%)",
    iconName: "Flame",
    blurb: "Glycogen tank running low. Body switching fuels.",
    description:
      "Liver glycogen is mostly exhausted. The body has to choose between making glucose from scratch (gluconeogenesis) or running on fat — and starts doing both. This is when ghrelin can spike briefly, then settle.",
    whatsHappening: [
      "Liver glycogen ~70-90% depleted (faster if exercising)",
      "Lipolysis increases — fat cells release free fatty acids into the bloodstream",
      "Liver starts producing modest amounts of ketones",
      "Norepinephrine begins rising to mobilize stored fuel",
      "Hunger may peak briefly, then subside as ghrelin cycle resets",
    ],
    benefits: [
      "Fat oxidation ramps up — burning stored fat directly",
      "Insulin sensitivity continues improving",
      "HGH (growth hormone) starts rising — preserves lean tissue",
      "Mild ketogenesis begins to dampen hunger",
      "Mitochondrial efficiency starts improving",
    ],
    research: [
      {
        citation:
          "Anton SD et al. — \"Flipping the Metabolic Switch,\" Obesity (Silver Spring), 2018",
      },
      { citation: "Cahill GF Jr. — Annual Review of Nutrition, 2006" },
      {
        citation:
          "Romijn JA et al. — \"Regulation of endogenous fat and carbohydrate metabolism in relation to exercise intensity,\" American Journal of Physiology, 1993",
      },
    ],
  },
  {
    slug: "switch",
    name: "Metabolic Switch",
    short: "Switch",
    fromHours: 16,
    toHours: 24,
    color: "hsl(212 95% 68%)",
    iconName: "RefreshCw",
    blurb: "Burning fat. Ketones rising. Autophagy on.",
    description:
      "The metabolic switch flips: the body is running predominantly on fat, with ketones beginning to fuel the brain. Autophagy — cellular self-cleaning — initiates. This is where most of the daily 16:8 / OMAD benefits compound.",
    whatsHappening: [
      "Liver producing measurable ketones (BHB, acetoacetate) — typically 0.3-1.0 mmol/L",
      "Brain begins using ketones for ~25-30% of its energy",
      "Insulin near lowest point of the day",
      "HGH 2-3× baseline — protects muscle while you fast",
      "Autophagy genes (LC3, ATG) upregulated — cellular cleanup begins",
      "Norepinephrine + epinephrine elevated — alertness + fat mobilization",
    ],
    benefits: [
      "Ketones provide cleaner brain fuel than glucose — many report sharper focus",
      "Significant fat oxidation; visible body composition effect over weeks",
      "Reduced hunger — ketones suppress appetite via the hypothalamus",
      "Autophagy initiation — recycling damaged proteins",
      "Anti-inflammatory effects (CRP, IL-6 trending down)",
      "Improved insulin sensitivity carrying into the next eating window",
    ],
    research: [
      {
        citation:
          "Anton SD et al. — \"Flipping the Metabolic Switch,\" Obesity, 2018",
      },
      {
        citation:
          "Mattson MP — \"Effects of Intermittent Fasting on Health, Aging, and Disease,\" New England Journal of Medicine, 2019",
      },
      {
        citation:
          "Mizushima N — \"Autophagy: process and function,\" Genes & Development, 2007",
      },
    ],
  },
  {
    slug: "ketosis",
    name: "Deep Ketosis + GH Surge",
    short: "Ketosis",
    fromHours: 24,
    toHours: 36,
    color: "hsl(43 96% 60%)",
    iconName: "Zap",
    blurb: "Deep ketosis. Growth hormone surging.",
    description:
      "Robust ketosis. The brain is running mostly on ketones now, hunger flattens, and growth hormone surges to ~5× baseline — Fung's signature point that fasting preserves (rather than destroys) lean muscle. Cancer cells, which prefer glucose, lose their easy fuel.",
    whatsHappening: [
      "BHB typically 1-3 mmol/L — full ketosis",
      "Brain runs primarily on ketones; minimum glucose from gluconeogenesis",
      "HGH ~5× baseline (Hartman 1992) — preserves muscle, drives lipolysis",
      "IGF-1 starts dropping — longevity signal (Longo)",
      "Insulin at the day's lowest — fat cells fully accessible",
      "Autophagy ramping up significantly",
      "Mitochondrial biogenesis stimulated — making more / better mitochondria",
    ],
    benefits: [
      "Significant fat loss with lean mass spared",
      "Reduced inflammation markers (CRP, IL-6, TNF-α)",
      "Mental clarity often peaks here",
      "Cancer cells lose preferred glucose fuel (Fung — The Cancer Code)",
      "Cellular cleanup accelerating",
      "Improved metabolic flexibility",
      "Norepinephrine boost preserves resting metabolic rate (no \"starvation mode\" myth)",
    ],
    research: [
      {
        citation:
          "Hartman ML et al. — \"Augmented growth hormone secretory burst frequency... after fasting,\" Journal of Clinical Endocrinology, 1992",
      },
      {
        citation: "Fung J — The Complete Guide to Fasting, 2016",
      },
      {
        citation:
          "Longo VD — \"Fasting, circadian rhythms, and time-restricted feeding,\" Cell Metabolism, 2016",
      },
      {
        citation:
          "Klein S et al. — \"Progressive alterations in lipid and glucose metabolism during short-term fasting,\" American Journal of Physiology, 1993",
      },
    ],
  },
  {
    slug: "autophagy",
    name: "Peak Autophagy",
    short: "Autophagy",
    fromHours: 36,
    toHours: 48,
    color: "hsl(24 94% 62%)",
    iconName: "Sparkles",
    blurb: "Cellular cleanup peaking. Immune reset starting.",
    description:
      "Autophagy is at full intensity. Damaged cellular components — misfolded proteins, broken mitochondria, dysfunctional organelles — get tagged and broken down. This is the longevity payoff that 36-48h fasts are doing the work for.",
    whatsHappening: [
      "Autophagy at peak — Atg gene expression maximized",
      "Mitophagy: damaged mitochondria specifically targeted for recycling",
      "Misfolded proteins broken down (linked to neurodegeneration prevention)",
      "Old immune cells start being cleared — turnover accelerates",
      "IGF-1 significantly suppressed (~30% drop)",
      "mTOR pathway suppressed (the growth/aging switch is OFF)",
      "AMPK pathway elevated (the longevity/repair switch is ON)",
    ],
    benefits: [
      "Major cellular renewal — getting rid of damaged components",
      "Removal of misfolded proteins (neuroprotective)",
      "Mitochondrial quality control — better energy production going forward",
      "Reduced cancer risk markers",
      "Inflammation markers continue dropping",
      "Potential autoimmune benefits via immune cell turnover",
      "Often: heightened mental clarity and focus",
    ],
    cautions: [
      "Electrolytes start to matter — sodium, magnesium, potassium",
      "Mild headaches or dizziness possible — usually fixed with salt + water",
      "Light activity only — heavy lifting/HIIT contraindicated past 24h fasted",
    ],
    research: [
      {
        citation:
          "Longo VD & Mattson MP — \"Fasting: Molecular Mechanisms and Clinical Applications,\" Cell Metabolism, 2014",
      },
      {
        citation:
          "Mizushima N et al. — \"Autophagy fights disease through cellular self-digestion,\" Nature, 2008",
      },
      {
        citation:
          "Levine B & Klionsky DJ — \"Development by self-digestion: molecular mechanisms and biological functions of autophagy,\" Developmental Cell, 2004",
      },
      {
        citation:
          "Alirezaei M et al. — \"Short-term fasting induces profound neuronal autophagy,\" Autophagy, 2010",
      },
    ],
  },
  {
    slug: "extended",
    name: "Extended Fast",
    short: "Extended",
    fromHours: 48,
    toHours: 72,
    color: "hsl(0 92% 68%)",
    iconName: "Heart",
    blurb: "Sustained ketosis. IGF-1 dropping. Mind your electrolytes.",
    description:
      "Sustained, deep fat-burning state. IGF-1 has dropped significantly — a key longevity signal. The body is now exclusively running on fat + ketones, with minimal protein loss thanks to growth hormone protection.",
    whatsHappening: [
      "Sustained deep ketosis (BHB often 2-5 mmol/L)",
      "Fat oxidation is the dominant fuel pathway",
      "IGF-1 dropped 30-50% from baseline",
      "Inflammation markers (CRP, IL-6) continue declining",
      "Norepinephrine elevated — preserves resting metabolic rate",
      "Glucose stable via gluconeogenesis from glycerol (fat backbone), not protein",
      "Electrolyte balance becomes critical — sodium loss accelerates",
    ],
    benefits: [
      "Significant fat loss with continued lean mass preservation",
      "IGF-1 suppression linked to cancer protection + longevity",
      "Continued autophagy benefits",
      "Insulin sensitivity dramatically improved",
      "Reduced oxidative stress",
      "Mental clarity remains high after the 36-48h adaptation hump",
      "Therapeutic effects on metabolic syndrome (Fung's clinical work)",
    ],
    cautions: [
      "Salt is non-negotiable — 1-2g sodium / day from broth or salt water",
      "Magnesium supplementation prevents cramps + sleep issues",
      "Refeeding must be careful — start with bone broth, then small protein meal",
      "Not appropriate during pregnancy, with eating disorder history, or on certain medications without medical supervision",
    ],
    research: [
      {
        citation:
          "Longo VD et al. — \"Fasting, Circadian Rhythms, and Time-Restricted Feeding in Healthy Lifespan,\" Cell Metabolism, 2016",
      },
      { citation: "Fung J — The Cancer Code, 2020" },
      {
        citation:
          "Klempel MC et al. — \"Intermittent fasting combined with calorie restriction is effective for weight loss,\" Nutrition Journal, 2012",
      },
      {
        citation:
          "Cahill GF Jr & Owen OE — \"Starvation in man,\" Clinical Endocrinology and Metabolism, 1976",
      },
    ],
  },
  {
    slug: "stem_cell",
    name: "Stem Cell Renewal",
    short: "Stem Cell",
    fromHours: 72,
    toHours: 96,
    color: "hsl(280 75% 65%)",
    iconName: "Atom",
    blurb: "Hematopoietic stem cells regenerating. Immune system reboot.",
    description:
      "Around 72 hours, Longo's USC research shows hematopoietic stem cells (the precursors to your immune system) start regenerating. Old, damaged immune cells are cleared and replaced — what Longo calls an \"immune system reboot.\" This is therapeutic territory.",
    whatsHappening: [
      "Hematopoietic stem cell activation — bone marrow regeneration",
      "Old / damaged immune cells cleared, new ones generated",
      "PKA / IGF-1 pathway suppression triggers stem cell mobilization (Cheng 2014)",
      "Continued autophagy + mitophagy at depth",
      "Cancer cells experience prolonged glucose deprivation (Fung)",
      "Body protein conservation maximized — gluconeogenesis primarily from glycerol",
      "Profound shift in inflammatory cytokine profile",
    ],
    benefits: [
      "Immune system renewal — old cells out, new cells in",
      "Stem-cell-driven repair across tissues",
      "Major reduction in chronic inflammation markers",
      "Enhanced longevity signaling (suppressed mTOR + IGF-1)",
      "Potential reset of autoimmune dysfunction",
      "Cancer-protective effects (especially during chemo, per Longo's protocols)",
      "Brain-derived neurotrophic factor (BDNF) elevated — neurogenesis support",
    ],
    cautions: [
      "Strongly recommend medical supervision for fasts beyond 72h",
      "Daily electrolyte protocol essential",
      "Refeeding syndrome risk — break with broth, then small protein meal, then build slowly over 24-48h",
      "Monitor for: severe weakness, fainting, irregular heartbeat — break the fast immediately if any occur",
    ],
    research: [
      {
        citation:
          "Cheng CW et al. — \"Prolonged Fasting Reduces IGF-1/PKA to Promote Hematopoietic-Stem-Cell-Based Regeneration and Reverse Immunosuppression,\" Cell Stem Cell, 2014",
      },
      {
        citation:
          "Longo VD — \"Programmed longevity, youthspan, and juventology,\" Aging Cell, 2019",
      },
      {
        citation:
          "Brandhorst S et al. — \"A Periodic Diet that Mimics Fasting Promotes Multi-System Regeneration,\" Cell Metabolism, 2015",
      },
      { citation: "Fung J — The Cancer Code, 2020" },
    ],
  },
  {
    slug: "deep_regen",
    name: "Deep Regeneration",
    short: "Regen",
    fromHours: 96,
    toHours: 120,
    color: "hsl(330 75% 65%)",
    iconName: "Activity",
    blurb: "Maximum stem cell activation. Mitochondrial overhaul.",
    description:
      "Deep into multi-day-fast territory. Stem cell activation continues, mitochondrial cleanup is profound, and the body is in pure repair mode. The metabolic and cellular benefits compound — but so does the need for careful supervision and refeeding.",
    whatsHappening: [
      "Maximum stem cell activation across multiple tissues",
      "Profound mitochondrial cleanup (mitophagy) and biogenesis",
      "Deep autophagy continues — long-half-life proteins finally getting recycled",
      "Protein conservation at peak — body fiercely defending lean tissue",
      "Immune system substantially renewed",
      "Sustained suppression of pro-aging pathways (mTOR, IGF-1, IIS)",
      "Significant accumulation of uric acid — important to manage",
    ],
    benefits: [
      "Deep cellular renewal across multiple systems",
      "Continued stem-cell-driven regeneration",
      "Maximum longevity signaling",
      "Profound metabolic flexibility — body becomes a cleaner fat-burner",
      "Pure fat-burning + repair mode",
      "Preliminary evidence: meaningful effects on autoimmune markers",
    ],
    cautions: [
      "Medical supervision strongly recommended at this point",
      "Risk of refeeding syndrome is real — proceed slowly",
      "Electrolyte management non-optional (sodium 2-3g/day, magnesium, potassium)",
      "Track HR, BP, weight loss rate",
      "Not appropriate without prior multi-day fasting experience",
    ],
    research: [
      { citation: "Longo VD — The Longevity Diet, 2018" },
      {
        citation:
          "Phillips MCL — \"Fasting as a Therapy in Neurological Disease,\" Nutrients, 2019",
      },
      {
        citation:
          "Stekovic S et al. — \"Alternate Day Fasting Improves Physiological and Molecular Markers of Aging,\" Cell Metabolism, 2019",
      },
      { citation: "Fung J — The Complete Guide to Fasting, 2016" },
    ],
  },
  {
    slug: "prolonged",
    name: "Prolonged Fast",
    short: "Prolonged",
    fromHours: 120,
    toHours: 240,
    color: "hsl(15 85% 65%)",
    iconName: "Crown",
    blurb: "Therapeutic territory. Medical supervision strongly advised.",
    description:
      "5+ days. This is therapeutic fasting — the territory Fung references for cancer protocols and severe metabolic disease. The body is fully adapted to running on fat + ketones, but the risk profile changes meaningfully past this point.",
    whatsHappening: [
      "Body fully fat-adapted — ketones supply >75% of brain fuel",
      "Continued stem-cell renewal",
      "IGF-1 at long-term lows",
      "Profound suppression of cancer-cell proliferation pathways (preclinical)",
      "Steady fat loss at ~0.5-0.75 lb / day from fat alone",
      "Glycerol from fat covers most of the body's residual glucose needs",
      "Slow but real loss of lean mass starts to accumulate past day 7",
    ],
    benefits: [
      "Therapeutic-grade benefits for metabolic disease",
      "Most documented: type 2 diabetes reversal protocols (Fung, IDM Program)",
      "Adjunct cancer protocol per Longo's published research",
      "Deep autoimmune resets reported (anecdotal + small studies)",
      "Profound mental + spiritual reset reported by long-term fasters",
    ],
    cautions: [
      "Do NOT attempt without medical supervision past day 5",
      "Refeeding syndrome is the primary mortality risk — careful, slow refeed required",
      "Monitor: BP, electrolytes, glucose, ketones daily",
      "Stop immediately for: severe weakness, confusion, fainting, irregular heart rhythm",
      "Not appropriate during: pregnancy, breastfeeding, active infection, eating disorder history, certain medication regimens",
      "Lean mass loss accelerates past day 7 even with HGH protection",
    ],
    research: [
      {
        citation:
          "Furmli S et al. — \"Therapeutic use of intermittent fasting for people with type 2 diabetes,\" BMJ Case Reports, 2018 (Fung-Furmli IDM clinic)",
      },
      {
        citation:
          "Wilhelmi de Toledo F et al. — \"Safety, health improvement and well-being during a 4 to 21-day fasting period,\" PLoS One, 2019",
      },
      { citation: "Longo VD — \"The Longevity Diet,\" 2018" },
      { citation: "Fung J — The Cancer Code, 2020" },
    ],
  },
];

import type { LucideIcon } from "lucide-react";
import {
  ShieldCheck,
  Leaf,
  Flame,
  RefreshCw,
  Zap,
  Sparkles,
  Heart,
  Activity,
  Atom,
  Crown,
} from "lucide-react";

export const PHASE_ICON_MAP: Record<Phase["iconName"], LucideIcon> = {
  ShieldCheck,
  Leaf,
  Flame,
  RefreshCw,
  Zap,
  Sparkles,
  Heart,
  Activity,
  Atom,
  Crown,
};

export function getPhaseIcon(phase: Phase): LucideIcon {
  return PHASE_ICON_MAP[phase.iconName];
}

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
  if (current.slug === "prolonged") return null;
  return current.toHours - elapsedHours;
}
