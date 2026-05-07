-- Crucible · Phase 2C — Workout details JSONB
-- Run this in your Supabase SQL editor after 0001_workouts.sql.
-- Idempotent: safe to re-run.
--
-- Adds a free-form `details` blob for type-specific workout data:
--   gtx      → { rpe, notes }
--   cardio   → { modality, minutes, rpe, notes }
--   recovery → { sauna_min, cold_plunge_min, walk_min, walk_distance_mi,
--                mobility_min, notes }
--
-- Lift workouts continue to use workout_sets — `details` stays null
-- for type='lift'. Schema is intentionally loose; we validate in the
-- TypeScript layer rather than locking ourselves into Postgres
-- constraints we'd have to migrate when the shape evolves.

alter table public.workouts
  add column if not exists details jsonb;

-- No new index needed — we don't query inside the JSON.
