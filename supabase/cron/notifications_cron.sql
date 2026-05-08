-- Crucible · Supabase pg_cron job for push notifications
--
-- Vercel's Hobby plan caps cron at once-per-day. We use Supabase's
-- pg_cron + pg_net extensions instead — free, scheduled as often as
-- you want, and the SQL runs on the Postgres server.
--
-- Run this once in the Supabase SQL editor. Re-running is safe
-- (cron.schedule replaces the existing job by name).
--
-- ⚠️ Replace the two placeholders below before running:
--   1. YOUR_VERCEL_DOMAIN   — e.g. crucible-puce.vercel.app
--   2. YOUR_CRON_SECRET     — same string you set in Vercel env

-- ── Extensions (Supabase free tier includes both) ──────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ── Schedule the call ──────────────────────────────────────────────
-- Every 5 minutes is plenty for phase-transition latency. Bump to
-- '* * * * *' for every-minute if you want quasi-instant pushes —
-- it's free either way.
select
  cron.schedule(
    'crucible-notifications',
    '*/5 * * * *',
    $$
      select net.http_post(
        url     := 'https://YOUR_VERCEL_DOMAIN/api/cron/notifications',
        headers := jsonb_build_object(
          'Authorization', 'Bearer YOUR_CRON_SECRET'
        )
      );
    $$
  );

-- ── Sanity check (run separately to verify the schedule is active) ─
-- select * from cron.job where jobname = 'crucible-notifications';

-- ── To remove the schedule later ────────────────────────────────────
-- select cron.unschedule('crucible-notifications');

-- ── Inspect recent runs ─────────────────────────────────────────────
-- select * from cron.job_run_details
-- where jobid = (select jobid from cron.job where jobname = 'crucible-notifications')
-- order by start_time desc
-- limit 20;
