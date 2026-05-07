-- Crucible · Phase 3 — Per-day planning overrides
-- Run this in your Supabase SQL editor after 0003_workout_details.sql.
-- Idempotent: safe to re-run.
--
-- The recurring weekday pattern (Mon = upper body, Tue = GTX, etc.)
-- still lives in code as the default. This table stores user-specific
-- overrides for individual calendar days — what workout + fasting
-- protocol the user wants for that day. Today's plan reads from this
-- table first and falls back to the recurring default if no row.

create table if not exists public.planned_days (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  date                     date not null,
  -- Workout slot. Null workout_type = rest (no workout planned).
  workout_type             text,                 -- 'lift' | 'gtx' | 'cardio' | 'recovery' | 'rest' | null
  workout_template_slug    text,                 -- only relevant when workout_type = 'lift'
  -- Fasting slot. Null = use the recurring default (intentional —
  -- letting the user clear an override on the fasting side without
  -- clearing the workout side).
  fasting_protocol_slug    text,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique(user_id, date)
);

create index if not exists planned_days_user_date_idx
  on public.planned_days(user_id, date);

-- ── RLS ─────────────────────────────────────────────────────────────
alter table public.planned_days enable row level security;

do $$
begin
  drop policy if exists planned_days_owner_select on public.planned_days;
  drop policy if exists planned_days_owner_insert on public.planned_days;
  drop policy if exists planned_days_owner_update on public.planned_days;
  drop policy if exists planned_days_owner_delete on public.planned_days;

  create policy planned_days_owner_select on public.planned_days
    for select using (auth.uid() = user_id);
  create policy planned_days_owner_insert on public.planned_days
    for insert with check (auth.uid() = user_id);
  create policy planned_days_owner_update on public.planned_days
    for update using (auth.uid() = user_id);
  create policy planned_days_owner_delete on public.planned_days
    for delete using (auth.uid() = user_id);
end $$;

-- Auto-bump updated_at on row changes.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists planned_days_set_updated_at on public.planned_days;
create trigger planned_days_set_updated_at
  before update on public.planned_days
  for each row execute function public.set_updated_at();
