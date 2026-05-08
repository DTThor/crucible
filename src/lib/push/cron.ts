import "server-only";

import { sendPush, type PushTarget, type PushPayload } from "./server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PHASES, type Phase } from "@/lib/fasting/phases";
import { PROTOCOLS, type ProtocolSlug } from "@/lib/fasting/protocols";
import { DEFAULT_TRAINING_WEEK } from "@/lib/training/templates";
import { DEFAULT_WEEKLY_TEMPLATE } from "@/lib/fasting/templates";
import {
  addDays,
  dowFromIso,
  localDateKey,
  todayKey,
} from "@/lib/tz";

/**
 * Single tick of the notification cron. Runs every ~15 minutes from
 * Vercel Cron. Idempotent + dedupe-aware: re-running won't duplicate
 * sends, missed runs catch up naturally next tick.
 *
 * Quiet hours (10pm – 7am Chicago) skip everything. The first tick
 * after 7am sees all crossed-but-unnotified phase boundaries for each
 * active fast and bundles them into a single "while you slept" push.
 */

const QUIET_START_HOUR = 22; // 10pm
const QUIET_END_HOUR = 7; // 7am
const APP_TZ = "America/Chicago";

interface CronResult {
  durationMs: number;
  inQuietHours: boolean;
  active_fasts_processed: number;
  phase_pushes: number;
  goal_pushes: number;
  water_pushes: number;
  eve_pushes: number;
  expired_subscriptions_deleted: number;
}

export async function runNotificationsTick(): Promise<CronResult> {
  const startedAt = Date.now();
  const result: CronResult = {
    durationMs: 0,
    inQuietHours: false,
    active_fasts_processed: 0,
    phase_pushes: 0,
    goal_pushes: 0,
    water_pushes: 0,
    eve_pushes: 0,
    expired_subscriptions_deleted: 0,
  };

  const now = new Date();
  const inQuiet = isInQuietHours(now);
  result.inQuietHours = inQuiet;

  const db = createAdminClient();

  // -- Long-fast eve reminders run at any non-quiet hour evening, so
  //    handle them first. Always per-user; no shared dependency on
  //    active fast state.
  if (!inQuiet) {
    result.eve_pushes = await processEveReminders(db, now);
  }

  // -- Active fast notifications (phase transitions, goal reached,
  //    water nudge). All skipped during quiet hours; the next post-7am
  //    tick catches up automatically because un-notified phases are
  //    identified by reading notifications_sent.
  if (!inQuiet) {
    const fastsResult = await processActiveFasts(db, now);
    result.active_fasts_processed = fastsResult.processed;
    result.phase_pushes = fastsResult.phasePushes;
    result.goal_pushes = fastsResult.goalPushes;
    result.water_pushes = fastsResult.waterPushes;
    result.expired_subscriptions_deleted +=
      fastsResult.expiredSubscriptionsDeleted;
  }

  result.durationMs = Date.now() - startedAt;
  return result;
}

// ── Quiet hours ─────────────────────────────────────────────────────

function isInQuietHours(now: Date): boolean {
  const hour = localHour(now);
  // 10pm-7am: hour >= 22 OR hour < 7
  return hour >= QUIET_START_HOUR || hour < QUIET_END_HOUR;
}

function localHour(now: Date): number {
  // en-GB returns a clean 0-23 with no AM/PM and no "24" quirk.
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TZ,
    hour: "2-digit",
    hour12: false,
  }).format(now);
  let hour = parseInt(hourStr, 10);
  // Belt-and-suspenders: if some runtime returns "24" for midnight,
  // normalize to 0.
  if (hour === 24) hour = 0;
  return hour;
}

// ── Active fast processing ──────────────────────────────────────────

interface ActiveFastsResult {
  processed: number;
  phasePushes: number;
  goalPushes: number;
  waterPushes: number;
  expiredSubscriptionsDeleted: number;
}

interface ActiveFastRow {
  id: string;
  user_id: string;
  protocol_slug: string;
  started_at: string;
}

async function processActiveFasts(
  db: ReturnType<typeof createAdminClient>,
  now: Date,
): Promise<ActiveFastsResult> {
  const out: ActiveFastsResult = {
    processed: 0,
    phasePushes: 0,
    goalPushes: 0,
    waterPushes: 0,
    expiredSubscriptionsDeleted: 0,
  };

  const { data: fasts, error } = await db
    .from("fasts")
    .select("id, user_id, protocol_slug, started_at")
    .eq("status", "active")
    .is("ended_at", null);
  if (error) {
    console.error("cron: active fasts query error:", error);
    return out;
  }

  for (const fast of (fasts ?? []) as ActiveFastRow[]) {
    out.processed++;
    const elapsedMs = now.getTime() - new Date(fast.started_at).getTime();
    if (elapsedMs <= 0) continue;
    const elapsedHours = elapsedMs / 3_600_000;

    // Subscriptions for the user — fetch once and reuse for all kinds.
    const { data: subs } = await db
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", fast.user_id);
    const targets = (subs ?? []) as PushTarget[];
    if (targets.length === 0) continue;

    // ── Phase transitions (bundled) ────────────────────────────────
    const phasePush = await processPhaseTransitions(
      db,
      fast,
      elapsedHours,
      targets,
    );
    if (phasePush.sent) out.phasePushes++;
    out.expiredSubscriptionsDeleted += phasePush.expired;

    // ── Goal reached ──────────────────────────────────────────────
    const goalPush = await processGoalReached(
      db,
      fast,
      elapsedHours,
      targets,
    );
    if (goalPush.sent) out.goalPushes++;
    out.expiredSubscriptionsDeleted += goalPush.expired;

    // ── Water reminder ────────────────────────────────────────────
    const waterPush = await processWaterReminder(
      db,
      fast,
      elapsedHours,
      now,
      targets,
    );
    if (waterPush.sent) out.waterPushes++;
    out.expiredSubscriptionsDeleted += waterPush.expired;
  }

  return out;
}

interface DispatchResult {
  sent: boolean;
  expired: number;
}

async function processPhaseTransitions(
  db: ReturnType<typeof createAdminClient>,
  fast: ActiveFastRow,
  elapsedHours: number,
  targets: PushTarget[],
): Promise<DispatchResult> {
  // Phases the fast has *now* crossed (excluding the fed-phase, which
  // gets no notification — you just ate).
  const crossed = PHASES.filter(
    (p) => p.fromHours > 0 && elapsedHours >= p.fromHours,
  );
  if (crossed.length === 0) return { sent: false, expired: 0 };

  const { data: notifiedRows } = await db
    .from("notifications_sent")
    .select("phase_slug")
    .eq("user_id", fast.user_id)
    .eq("fast_id", fast.id)
    .eq("kind", "phase_transition");
  const notifiedSlugs = new Set(
    (notifiedRows ?? []).map(
      (r) => (r as { phase_slug: string }).phase_slug,
    ),
  );
  const pending = crossed.filter((p) => !notifiedSlugs.has(p.slug));
  if (pending.length === 0) return { sent: false, expired: 0 };

  // Build one push for all pending phases.
  const payload = buildPhasePayload(pending);
  const { delivered, expired } = await deliver(db, targets, payload);
  if (delivered === 0) return { sent: false, expired };

  // Mark every pending phase as sent.
  const rows = pending.map((p) => ({
    user_id: fast.user_id,
    fast_id: fast.id,
    kind: "phase_transition",
    phase_slug: p.slug,
    payload,
  }));
  const { error: insertErr } = await db
    .from("notifications_sent")
    .upsert(rows, {
      onConflict: "user_id,fast_id,phase_slug",
      ignoreDuplicates: true,
    });
  if (insertErr) console.error("cron: phase dedupe insert error:", insertErr);

  return { sent: true, expired };
}

function buildPhasePayload(pending: Phase[]): PushPayload {
  if (pending.length === 1) {
    const p = pending[0];
    return {
      title: `Crucible · ${p.name}`,
      body: `You've entered ${p.name} (${p.fromHours}h+). ${p.blurb}`,
      url: "/fast",
      tag: `phase-${p.slug}`,
    };
  }
  // Bundle: probably overnight catch-up.
  const last = pending[pending.length - 1];
  const names = pending.map((p) => p.name).join(", ");
  return {
    title: "Crucible · While you slept",
    body: `Crossed ${pending.length} phases: ${names}. You're now in ${last.name}.`,
    url: "/fast",
    tag: "phase-bundle",
  };
}

async function processGoalReached(
  db: ReturnType<typeof createAdminClient>,
  fast: ActiveFastRow,
  elapsedHours: number,
  targets: PushTarget[],
): Promise<DispatchResult> {
  const protocol =
    PROTOCOLS[fast.protocol_slug as ProtocolSlug] ?? PROTOCOLS.omad;
  if (elapsedHours < protocol.targetHours) return { sent: false, expired: 0 };

  // Already notified?
  const { data: existing } = await db
    .from("notifications_sent")
    .select("id")
    .eq("user_id", fast.user_id)
    .eq("fast_id", fast.id)
    .eq("kind", "goal_reached")
    .maybeSingle();
  if (existing) return { sent: false, expired: 0 };

  const payload: PushPayload = {
    title: "Crucible · Goal reached",
    body: `You hit your ${protocol.name} target (${protocol.targetHours}h). Break the fast when you're ready.`,
    url: "/fast",
    tag: `goal-${fast.id}`,
  };
  const { delivered, expired } = await deliver(db, targets, payload);
  if (delivered === 0) return { sent: false, expired };

  const { error: insertErr } = await db
    .from("notifications_sent")
    .insert({
      user_id: fast.user_id,
      fast_id: fast.id,
      kind: "goal_reached",
      payload,
    });
  if (insertErr) {
    // Conflict is fine (race with another cron run); other errors log.
    if (insertErr.code !== "23505") {
      console.error("cron: goal dedupe insert error:", insertErr);
    }
  }
  return { sent: true, expired };
}

async function processWaterReminder(
  db: ReturnType<typeof createAdminClient>,
  fast: ActiveFastRow,
  elapsedHours: number,
  now: Date,
  targets: PushTarget[],
): Promise<DispatchResult> {
  // Fire only after 12h elapsed, and only between 8am and 8pm local
  // (avoid mealtimes and avoid fasting people in early morning).
  if (elapsedHours < 12) return { sent: false, expired: 0 };
  const hour = localHour(now);
  if (hour < 8 || hour >= 20) return { sent: false, expired: 0 };

  // Already nudged today?
  const today = todayKey();
  const { data: existing } = await db
    .from("notifications_sent")
    .select("id")
    .eq("user_id", fast.user_id)
    .eq("fast_id", fast.id)
    .eq("kind", "water_reminder")
    .eq("for_date", today)
    .maybeSingle();
  if (existing) return { sent: false, expired: 0 };

  // Has any water been logged today (Chicago time)?
  const todayStartIso = startOfTodayUtcIso();
  const { data: water } = await db
    .from("water_logs")
    .select("id")
    .eq("user_id", fast.user_id)
    .gte("logged_at", todayStartIso)
    .limit(1);
  if ((water ?? []).length > 0) return { sent: false, expired: 0 };

  const payload: PushPayload = {
    title: "Crucible · Hydrate",
    body: `${Math.floor(elapsedHours)}h into your fast and no water logged today. A pint helps with hunger and electrolytes.`,
    url: "/",
    tag: `water-${today}`,
  };
  const { delivered, expired } = await deliver(db, targets, payload);
  if (delivered === 0) return { sent: false, expired };

  const { error } = await db.from("notifications_sent").insert({
    user_id: fast.user_id,
    fast_id: fast.id,
    kind: "water_reminder",
    for_date: today,
    payload,
  });
  if (error && error.code !== "23505") {
    console.error("cron: water dedupe insert error:", error);
  }
  return { sent: true, expired };
}

// ── Long-fast eve reminders ─────────────────────────────────────────

async function processEveReminders(
  db: ReturnType<typeof createAdminClient>,
  now: Date,
): Promise<number> {
  const hour = localHour(now);
  // Fire between 6pm and just before quiet hours (10pm). Dedupe via
  // for_date — the row uses *tomorrow's* date as the key, so the same
  // user-day combination only fires once.
  if (hour < 18 || hour >= QUIET_START_HOUR) return 0;

  const today = todayKey();
  const tomorrow = addDays(today, 1);

  // Pull every push-subscribed user; for each, resolve their plan for
  // tomorrow (override OR weekday default) and fire if it's a long
  // fast.
  const { data: userRows } = await db
    .from("push_subscriptions")
    .select("user_id");
  const userIds = Array.from(
    new Set((userRows ?? []).map((r) => (r as { user_id: string }).user_id)),
  );
  if (userIds.length === 0) return 0;

  // Map of user_id → planned_days row for tomorrow (if any override).
  const { data: overrideRows } = await db
    .from("planned_days")
    .select("user_id, fasting_protocol_slug")
    .eq("date", tomorrow)
    .in("user_id", userIds);
  const overrideByUser = new Map<string, string | null>();
  for (const row of overrideRows ?? []) {
    const r = row as {
      user_id: string;
      fasting_protocol_slug: string | null;
    };
    overrideByUser.set(r.user_id, r.fasting_protocol_slug);
  }

  // Map of user_id → already-sent eve reminder for tomorrow.
  const { data: sentRows } = await db
    .from("notifications_sent")
    .select("user_id")
    .eq("for_date", tomorrow)
    .eq("kind", "long_fast_eve")
    .in("user_id", userIds);
  const alreadySent = new Set(
    (sentRows ?? []).map((r) => (r as { user_id: string }).user_id),
  );

  let pushed = 0;
  const tomorrowDow = dowFromIso(tomorrow);
  const defaultTomorrowProtocol = DEFAULT_WEEKLY_TEMPLATE[tomorrowDow];
  const tomorrowDefaultWorkout = DEFAULT_TRAINING_WEEK[tomorrowDow];

  for (const userId of userIds) {
    if (alreadySent.has(userId)) continue;

    // Effective protocol for tomorrow: override > default
    const overrideProtocol = overrideByUser.get(userId) ?? null;
    const effectiveProtocol = (overrideProtocol ??
      defaultTomorrowProtocol) as ProtocolSlug;
    if (effectiveProtocol !== "36h" && effectiveProtocol !== "42h") {
      continue;
    }

    // Subscriptions for this user
    const { data: subs } = await db
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);
    const targets = (subs ?? []) as PushTarget[];
    if (targets.length === 0) continue;

    const protocolName =
      PROTOCOLS[effectiveProtocol]?.name ?? effectiveProtocol;
    const workoutName = tomorrowDefaultWorkout?.label ?? "recovery";
    const payload: PushPayload = {
      title: "Crucible · Last meal coming up",
      body: `Tomorrow is your ${protocolName} fast. Tonight's dinner is your last meal — workout's set to ${workoutName}.`,
      url: "/plan",
      tag: `eve-${tomorrow}`,
    };
    const { delivered } = await deliver(db, targets, payload);
    if (delivered === 0) continue;

    const { error } = await db.from("notifications_sent").insert({
      user_id: userId,
      kind: "long_fast_eve",
      for_date: tomorrow,
      payload,
    });
    if (error && error.code !== "23505") {
      console.error("cron: eve dedupe insert error:", error);
    }
    pushed++;
  }
  return pushed;
}

// ── Delivery helpers ────────────────────────────────────────────────

async function deliver(
  db: ReturnType<typeof createAdminClient>,
  targets: PushTarget[],
  payload: PushPayload,
): Promise<{ delivered: number; expired: number }> {
  let delivered = 0;
  const expiredEndpoints: string[] = [];

  for (const t of targets) {
    const r = await sendPush(t, payload);
    if (r === "ok") delivered++;
    else if (r === "expired") expiredEndpoints.push(t.endpoint);
  }

  if (expiredEndpoints.length > 0) {
    await db
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  return { delivered, expired: expiredEndpoints.length };
}

// ── Time helpers (local copies to keep this module self-contained) ─

function startOfTodayUtcIso(): string {
  const today = todayKey();
  // DST-correct start of Chicago today as a UTC ISO timestamp.
  for (const offset of ["-05:00", "-06:00"]) {
    const dt = new Date(`${today}T00:00:00${offset}`);
    if (localDateKey(dt) === today) return dt.toISOString();
  }
  // Fallback: switch by month
  const month = parseInt(today.slice(5, 7), 10);
  const offset = month >= 4 && month <= 10 ? "-05:00" : "-06:00";
  return new Date(`${today}T00:00:00${offset}`).toISOString();
}
