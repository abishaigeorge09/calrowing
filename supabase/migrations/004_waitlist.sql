-- Migration 004: Waitlist / Early Access sign-ups
-- Run this in Supabase SQL Editor after migrations 001–003

CREATE TABLE IF NOT EXISTS waitlist (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  role           TEXT CHECK (role IN ('coach', 'athlete')),
  school_or_team TEXT,
  reason         TEXT
);

CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist(email);
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON waitlist(created_at DESC);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated / anon) can submit their info
CREATE POLICY "anon_can_insert_waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (true);

-- Only service_role (Supabase dashboard / backend) can read submissions
CREATE POLICY "service_role_can_select_waitlist"
  ON waitlist FOR SELECT
  USING (auth.role() = 'service_role');
