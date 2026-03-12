-- Migration 007: Coach survey builder
-- Coaches can create custom surveys or use templates and send them to athletes

CREATE TABLE surveys (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id      UUID REFERENCES teams(id) ON DELETE CASCADE,
  coach_id     UUID REFERENCES auth.users(id),
  title        TEXT NOT NULL,
  description  TEXT,
  questions    JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- question format: [{id, type, text, options?}]
  -- types: 'text' | 'scale_1_5' | 'scale_1_10' | 'multiple_choice' | 'yes_no'
  is_template  BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE survey_assignments (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  survey_id    UUID REFERENCES surveys(id) ON DELETE CASCADE,
  athlete_id   UUID REFERENCES auth.users(id),  -- NULL means whole team
  team_id      UUID REFERENCES teams(id),
  assigned_at  TIMESTAMPTZ DEFAULT NOW(),
  due_at       TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE survey_responses (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  survey_id      UUID REFERENCES surveys(id) ON DELETE CASCADE,
  assignment_id  UUID REFERENCES survey_assignments(id),
  athlete_id     UUID NOT NULL REFERENCES auth.users(id),
  answers        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their team's surveys
CREATE POLICY "coaches_manage_surveys" ON surveys
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE team_id = surveys.team_id AND role = 'coach')
  );

-- Athletes can read surveys assigned to them
CREATE POLICY "athletes_read_surveys" ON surveys
  FOR SELECT USING (
    auth.uid() IN (
      SELECT sa.athlete_id FROM survey_assignments sa WHERE sa.survey_id = surveys.id
        AND (sa.athlete_id = auth.uid() OR sa.team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()))
    )
  );

-- Survey assignments: coaches can manage, athletes can see their own
CREATE POLICY "coaches_manage_assignments" ON survey_assignments
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE team_id = survey_assignments.team_id AND role = 'coach')
  );

CREATE POLICY "athletes_read_assignments" ON survey_assignments
  FOR SELECT USING (
    athlete_id = auth.uid() OR
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid() AND role = 'athlete')
  );

CREATE POLICY "athletes_update_assignments" ON survey_assignments
  FOR UPDATE USING (
    athlete_id = auth.uid() OR
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid() AND role = 'athlete')
  );

-- Responses: athletes can insert their own, coaches can read their team's
CREATE POLICY "athletes_insert_responses" ON survey_responses
  FOR INSERT WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "coaches_read_responses" ON survey_responses
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.id FROM profiles p
      JOIN surveys s ON s.team_id = p.team_id
      WHERE s.id = survey_responses.survey_id AND p.role = 'coach'
    )
  );

CREATE POLICY "athletes_read_own_responses" ON survey_responses
  FOR SELECT USING (auth.uid() = athlete_id);
