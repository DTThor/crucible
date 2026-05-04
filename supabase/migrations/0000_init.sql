-- Crucible · Phase 0 init
--
-- Run this in your Supabase project's SQL editor (or via `supabase db push`)
-- after creating the project. It is idempotent — safe to re-run.

-- ─── Extensions ──────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── profiles ────────────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  display_name         text,
  dob                  date,
  height_cm            numeric,
  sex                  text,
  timezone             text not null default 'America/Chicago',
  goal_weight_kg       numeric,
  units_weight         text not null default 'lb',
  fasting_template_id  uuid,
  training_template_id uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Auto-create a profile row on auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', null));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute procedure public.touch_updated_at();

-- ─── fasting_protocols (seed data, shared across users) ─────────────
create table if not exists public.fasting_protocols (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  name                 text not null,
  target_hours         integer not null,
  eating_window_hours  integer not null,
  description          text
);

insert into public.fasting_protocols (slug, name, target_hours, eating_window_hours, description)
values
  ('16:8', '16:8',   16, 8,  'Daily floor. Skip breakfast, eat lunch + dinner.'),
  ('18:6', '18:6',   18, 6,  'Slightly tighter window than 16:8.'),
  ('omad', 'OMAD',   23, 1,  'One Meal A Day. Compresses insulin exposure.'),
  ('36h',  '36-hour',36, 0,  'Skip dinner, full next day, dinner the day after.'),
  ('42h',  '42-hour',42, 0,  'Extends 36h by skipping breakfast on the refeed day.')
on conflict (slug) do nothing;

-- ─── fasting_templates ──────────────────────────────────────────────
create table if not exists public.fasting_templates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  week_pattern jsonb not null,
  is_active    boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists fasting_templates_user_idx on public.fasting_templates(user_id);

-- ─── fasts ──────────────────────────────────────────────────────────
create table if not exists public.fasts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  protocol_slug   text not null,
  planned_end_at  timestamptz,
  started_at      timestamptz not null,
  ended_at        timestamptz,
  status          text not null default 'active',
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists fasts_user_started_idx on public.fasts(user_id, started_at desc);
create index if not exists fasts_user_active_idx  on public.fasts(user_id, status);

-- ─── water_logs ─────────────────────────────────────────────────────
create table if not exists public.water_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  ml         integer not null,
  logged_at  timestamptz not null default now()
);
create index if not exists water_logs_user_logged_idx on public.water_logs(user_id, logged_at desc);

-- ─── weight_logs ────────────────────────────────────────────────────
create table if not exists public.weight_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  weight_kg  numeric not null,
  logged_at  timestamptz not null default now(),
  source     text not null default 'manual'
);
create index if not exists weight_logs_user_logged_idx on public.weight_logs(user_id, logged_at desc);

-- ─── Row-Level Security ─────────────────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.fasting_templates  enable row level security;
alter table public.fasts              enable row level security;
alter table public.water_logs         enable row level security;
alter table public.weight_logs        enable row level security;
alter table public.fasting_protocols  enable row level security;

-- profiles: user can read/update only their own row
drop policy if exists profiles_self_read   on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_read   on public.profiles for select using (auth.uid() = user_id);
create policy profiles_self_update on public.profiles for update using (auth.uid() = user_id);

-- generic "owner" policies for the user-owned tables
do $$
declare
  t text;
begin
  foreach t in array array['fasting_templates','fasts','water_logs','weight_logs']
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

-- fasting_protocols: read-only to all signed-in users
drop policy if exists fasting_protocols_read on public.fasting_protocols;
create policy fasting_protocols_read on public.fasting_protocols
  for select to authenticated using (true);
