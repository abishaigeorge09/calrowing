-- Migration 003: Notifications + Push Subscriptions + pg_cron scheduler
-- Run this in Supabase SQL Editor after migration 001 and 002

-- ============================================================
-- Enable extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Note: pg_cron is available on Supabase Pro/Team. On free tier,
-- use Supabase Edge Function with a manual cron trigger or GitHub Actions.
-- Uncomment the cron schedule below if pg_cron is available on your plan:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- notifications — in-app and push notification records
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
                -- Survey reminders (sent by scheduler)
                'morning_reminder',
                'post_session_reminder',
                'evening_reminder',
                -- Coach notifications (sent when athlete submits check-in)
                'survey_submitted',
                'pain_flag',
                'injury_flag',
                -- Legacy alert types
                'alert_soreness',
                'alert_sleep',
                'alert_injury',
                'alert_pattern',
                'coach_message'
              )),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  action_url  TEXT,           -- deep link: '/coach/athlete/:id', '/athlete', etc.
  data        JSONB,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications(user_id, read_at) WHERE read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "own_notifications_select"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read (UPDATE)
CREATE POLICY "own_notifications_update"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone authenticated can insert notifications (coach notifying athlete, athlete notifying coach)
-- In production you may restrict this to service_role only via RLS bypass
CREATE POLICY "authenticated_can_insert_notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================
-- push_subscriptions — Web Push API subscription objects
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users manage their own push subscriptions
CREATE POLICY "own_push_subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can delete expired/invalid subscriptions
-- Note: DELETE only supports USING (not WITH CHECK)
CREATE POLICY "service_manage_push_subs"
  ON push_subscriptions FOR DELETE
  USING (true);

-- ============================================================
-- pg_cron schedule (uncomment if pg_cron is available)
-- This calls the survey-scheduler Edge Function every 30 minutes.
-- Requires pg_net extension and app.supabase_url / app.service_role_key settings.
-- ============================================================
-- SELECT cron.schedule(
--   'survey-scheduler',
--   '*/30 * * * *',
--   $$
--   SELECT net.http_post(
--     url     := current_setting('app.supabase_url') || '/functions/v1/survey-scheduler',
--     headers := jsonb_build_object(
--                  'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
--                  'Content-Type', 'application/json'),
--     body    := '{}'::jsonb
--   );
--   $$
-- );
-- To set the required settings:
-- ALTER DATABASE postgres SET app.supabase_url = 'https://YOUR_PROJECT.supabase.co';
-- ALTER DATABASE postgres SET app.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
