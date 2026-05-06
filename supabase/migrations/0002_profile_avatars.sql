-- Crucible · Profile avatars + display_name
-- Adds an avatar_url column and a Supabase Storage bucket with RLS so
-- each user can upload/replace their own avatar but everyone can read.
--
-- Run this in your Supabase SQL editor after 0001_workouts.sql.
-- Idempotent: safe to re-run.

-- ── profiles.avatar_url ─────────────────────────────────────────────
alter table public.profiles
  add column if not exists avatar_url text;

-- ── avatars storage bucket ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ── Storage RLS policies (paths are <user_id>/<filename>) ──────────
drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users insert own avatar" on storage.objects;
create policy "Users insert own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
