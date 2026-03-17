-- Migration 012: Fix sessions INSERT and UPDATE RLS policies
-- The original policies used get_my_team_id() which returns NULL when a coach's
-- profile.team_id is not yet set, causing `team_id = NULL` to always be FALSE.
-- We replace them with a subquery pattern (same approach as the working DELETE policy
-- added in migration 005) that avoids NULL comparison issues entirely.

DROP POLICY IF EXISTS "sessions_insert" ON sessions;
DROP POLICY IF EXISTS "sessions_update" ON sessions;

CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE team_id = sessions.team_id
        AND role = 'coach'
    )
  );

CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE team_id = sessions.team_id
        AND role = 'coach'
    )
  );
