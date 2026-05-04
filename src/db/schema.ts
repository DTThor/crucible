import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Phase 0 schema. Profiles + fasting tables go in now so Phase 1 can ship
 * features without DB-migration work. Workout tables come in Phase 2.
 *
 * Convention: every user-owned table has user_id; RLS in 0000_init.sql
 * restricts SELECT/INSERT/UPDATE/DELETE to auth.uid() = user_id.
 */

// ─── Auth bridge ──────────────────────────────────────────────
// Supabase manages auth.users. We mirror only what we need.
export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey(),
  displayName: text("display_name"),
  dob: date("dob"),
  heightCm: numeric("height_cm"),
  sex: text("sex"),
  timezone: text("timezone").notNull().default("America/Chicago"),
  goalWeightKg: numeric("goal_weight_kg"),
  unitsWeight: text("units_weight").notNull().default("lb"), // 'lb' | 'kg'
  fastingTemplateId: uuid("fasting_template_id"),
  trainingTemplateId: uuid("training_template_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Fasting ──────────────────────────────────────────────────
export const fastingProtocols = pgTable("fasting_protocols", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(), // '16:8' | '18:6' | 'omad' | '36h' | '42h'
  name: text("name").notNull(),
  targetHours: integer("target_hours").notNull(),
  eatingWindowHours: integer("eating_window_hours").notNull(),
  description: text("description"),
});

export const fastingTemplates = pgTable(
  "fasting_templates",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    weekPattern: jsonb("week_pattern").notNull(), // [{day:'mon', protocol:'omad'}, ...]
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("fasting_templates_user_idx").on(t.userId),
  }),
);

export const fasts = pgTable(
  "fasts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull(),
    protocolSlug: text("protocol_slug").notNull(),
    plannedEndAt: timestamp("planned_end_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    status: text("status").notNull().default("active"), // 'active' | 'completed' | 'broken_early' | 'extended'
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userStartIdx: index("fasts_user_started_idx").on(t.userId, t.startedAt),
    userActiveIdx: index("fasts_user_active_idx").on(t.userId, t.status),
  }),
);

export const waterLogs = pgTable(
  "water_logs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull(),
    ml: integer("ml").notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userLoggedIdx: index("water_logs_user_logged_idx").on(t.userId, t.loggedAt),
  }),
);

export const weightLogs = pgTable(
  "weight_logs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull(),
    weightKg: numeric("weight_kg").notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    source: text("source").notNull().default("manual"), // 'manual' | 'withings' | 'apple_health'
  },
  (t) => ({
    userLoggedIdx: index("weight_logs_user_logged_idx").on(
      t.userId,
      t.loggedAt,
    ),
  }),
);

// ─── Type exports for app code ────────────────────────────────
export type Profile = typeof profiles.$inferSelect;
export type Fast = typeof fasts.$inferSelect;
export type NewFast = typeof fasts.$inferInsert;
export type WaterLog = typeof waterLogs.$inferSelect;
export type WeightLog = typeof weightLogs.$inferSelect;
export type FastingProtocol = typeof fastingProtocols.$inferSelect;
export type FastingTemplate = typeof fastingTemplates.$inferSelect;
