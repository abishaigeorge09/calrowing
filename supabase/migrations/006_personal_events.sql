-- Migration 006: Personal events for athlete calendar
-- Athletes can add personal events (class, study, appointment, etc.) to their calendar

CREATE TABLE personal_events (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  athlete_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,        -- 'YYYY-MM-DD'
  title       TEXT NOT NULL,
  start_time  TEXT NOT NULL,        -- 'HH:MM'
  end_time    TEXT NOT NULL,        -- 'HH:MM'
  color       TEXT DEFAULT 'purple', -- 'cyan'|'blue'|'purple'|'green'|'orange'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX personal_events_athlete_date ON personal_events(athlete_id, date);

ALTER TABLE personal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "athlete_own_events" ON personal_events
  FOR ALL
  USING (auth.uid() = athlete_id);
