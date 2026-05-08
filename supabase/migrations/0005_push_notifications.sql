-- Crucible · Phase 4 (slice A) — Web push subscriptions
-- Run this in your Supabase SQL editor after 0004_planned_days.sql.
-- Idempotent: safe to re-run.

-- ── push_subscriptions ──────────────────────────────────────────────
-- One row per (user, push endpoint). A single user can have multiple
-- devices/installs subscribed. The endpoint string is unique per
-- subscription; replacing it cleanly handles re-subscriptions.
create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  endpoint     text not null,
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(user_id, endpoint)
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions(user_id);

-- ── notifications_sent ──────────────────────────────────────────────
-- Dedupe ledger so the cron job doesn't double-send. Each "kind" has
-- a stable key per (user, fast, kind[, phase]) so we can ON CONFLICT
-- DO NOTHING when inserting.
create table if not exists public.notifications_sent (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  fast_id      uuid references public.fasts(id) on delete cascade,
  kind         text not null,                 -- 'phase_transition' | 'goal_reached' | 'long_fast_eve' | 'water_reminder'
  phase_slug   text,                          -- only set for phase_transition rows
  -- For long_fast_eve we need a per-day key (not per-fast since fast hasn't started yet).
  for_date     date,
  payload      jsonb,
  sent_at      timestamptz not null default now()
);

-- Unique constraint differs by kind. Use a partial unique index per
-- kind to keep things tidy.
create unique index if not exists notifications_sent_phase_uq
  on public.notifications_sent(user_id, fast_id, phase_slug)
  where kind = 'phase_transition';

create unique index if not exists notifications_sent_goal_uq
  on public.notifications_sent(user_id, fast_id)
  where kind = 'goal_reached';

create unique index if not exists notifications_sent_eve_uq
  on public.notifications_sent(user_id, for_date)
  where kind = 'long_fast_eve';

create unique index if not exists notifications_sent_water_uq
  on public.notifications_sent(user_id, fast_id, for_date)
  where kind = 'water_reminder';

create index if not exists notifications_sent_user_sent_idx
  on public.notifications_sent(user_id, sent_at desc);

-- ── RLS ─────────────────────────────────────────────────────────────
alter table public.push_subscriptions  enable row level security;
alter table public.notifications_sent  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['push_subscriptions','notifications_sent']
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

-- Auto-bump updated_at on push_subscriptions row changes.
drop trigger if exists push_subscriptions_set_updated_at on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();
