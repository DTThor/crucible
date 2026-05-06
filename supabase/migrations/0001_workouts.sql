-- Crucible · Phase 2 — Workouts
-- Run this in your Supabase SQL editor after 0000_init.sql.
-- Idempotent: safe to re-run.

-- ── workouts ────────────────────────────────────────────────────────
create table if not exists public.workouts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            text not null,           -- 'gtx' | 'lift' | 'cardio' | 'recovery'
  template_slug   text,                    -- e.g. 'upper_body_db'
  started_at      timestamptz not null,
  ended_at        timestamptz,
  rpe_overall     integer,
  notes           text,
  status          text not null default 'active', -- 'active' | 'completed' | 'abandoned'
  created_at      timestamptz not null default now()
);

create index if not exists workouts_user_started_idx
  on public.workouts(user_id, started_at desc);
create index if not exists workouts_user_active_idx
  on public.workouts(user_id, status);

-- ── workout_sets ────────────────────────────────────────────────────
-- user_id is denormalized here so RLS policies stay simple (matches the
-- pattern used by water_logs / weight_logs).
create table if not exists public.workout_sets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  workout_id      uuid not null references public.workouts(id) on delete cascade,
  exercise_slug   text not null,
  set_number      integer not null,
  reps            integer,
  weight_kg       numeric,
  rpe             integer,
  was_warmup      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists workout_sets_workout_idx
  on public.workout_sets(workout_id, set_number);
create index if not exists workout_sets_user_exercise_idx
  on public.workout_sets(user_id, exercise_slug, created_at desc);

-- ── RLS ─────────────────────────────────────────────────────────────
alter table public.workouts      enable row level security;
alter table public.workout_sets  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['workouts','workout_sets']
  loop
    execute format('drop policy if exists %I_owner_select on public.%I', t, t);
    execute format('drop policy if exists %I_owner_insert on public.%I', t, t);
    execute format('drop policy if exists %I_owner_update on public.%I', t, t);
    execute format('drop policy if exists %I_owner_delete on public.%I', t, t);

    execute format('create policy %I_owner_select on public.%I for select using (auth.uid() = user_id)', t, t);
    execute format('create policy %I_owner_insert on public.%I for insert with check (auth.uid() = user_id)', t, t);
    execute format('create policy %I_owner_update on public.%I for update using (auth.uid() = user_id)', t, t);
    execute format('create policy %I_owner_delete on public.%I for delete using (auth.uid() = user_id)', t, t);
  end loop;
end $$;
