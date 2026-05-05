/**
 * Fasting protocols. Mirrors what's seeded in supabase/migrations/0000_init.sql
 * via fasting_protocols. Source of truth for client-side display when we
 * don't want to round-trip the DB just to label a button.
 */
export type ProtocolSlug = "16:8" | "18:6" | "omad" | "36h" | "42h";

export interface Protocol {
  slug: ProtocolSlug;
  name: string;
  targetHours: number;
  eatingWindowHours: number;
  description: string;
}

export const PROTOCOLS: Record<ProtocolSlug, Protocol> = {
  "16:8": {
    slug: "16:8",
    name: "16:8",
    targetHours: 16,
    eatingWindowHours: 8,
    description: "Daily floor. Skip breakfast, eat lunch + dinner.",
  },
  "18:6": {
    slug: "18:6",
    name: "18:6",
    targetHours: 18,
    eatingWindowHours: 6,
    description: "Slightly tighter window than 16:8.",
  },
  omad: {
    slug: "omad",
    name: "OMAD",
    targetHours: 23,
    eatingWindowHours: 1,
    description: "One Meal A Day. Compresses insulin exposure to one window.",
  },
  "36h": {
    slug: "36h",
    name: "36-hour",
    targetHours: 36,
    eatingWindowHours: 0,
    description: "Skip dinner, full next day, dinner the day after.",
  },
  "42h": {
    slug: "42h",
    name: "42-hour",
    targetHours: 42,
    eatingWindowHours: 0,
    description: "Extends 36h by skipping breakfast on the refeed day.",
  },
};

export const PROTOCOL_OPTIONS: Protocol[] = Object.values(PROTOCOLS);

export function getProtocol(slug: string): Protocol {
  return PROTOCOLS[slug as ProtocolSlug] ?? PROTOCOLS.omad;
}
