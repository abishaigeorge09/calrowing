-- Migration 005: Session enhancements
-- Adds start_time, end_time, media_urls columns + DELETE RLS policy for coaches

-- Add start and end time columns
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Add media attachments as JSONB array
-- item format: {url: string, title?: string, type: 'image'|'video'|'link'}
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;

-- Allow coaches to delete sessions they created (or any session in their team)
CREATE POLICY "coaches_can_delete_sessions" ON sessions
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE team_id = sessions.team_id
        AND role = 'coach'
    )
  );
