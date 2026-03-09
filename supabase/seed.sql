-- RowIQ Seed Data
-- Creates demo accounts + 14 days of realistic wellness/session data
--
-- IMPORTANT: Run 001_initial_schema.sql FIRST.
-- Then create auth users via Supabase Dashboard or CLI, then run this.
--
-- Demo Credentials (all use password: Demo1234!)
--   coach@rowiq.demo       → Coach Mike Teti
--   alex@rowiq.demo        → Athlete Alex Chen (soreness alert)
--   jordan@rowiq.demo      → Athlete Jordan Rivera (low sleep alert)
--   sam@rowiq.demo         → Athlete Sam Park (exam week)
--   taylor@rowiq.demo      → Athlete Taylor Kim
--   morgan@rowiq.demo      → Athlete Morgan Walsh
--   casey@rowiq.demo       → Athlete Casey Liu
--   riley@rowiq.demo       → Athlete Riley Torres
--   jamie@rowiq.demo       → Athlete Jamie Scott
--
-- Step 1: Create users in Supabase Auth (Dashboard > Authentication > Users > Add user)
--   OR use the Supabase CLI:
--     supabase auth users create --email coach@rowiq.demo --password Demo1234!
--     (repeat for each athlete email)
--
-- Step 2: Copy the UUIDs from the auth.users table and replace the
--   placeholders below. Then run this file in the SQL Editor.

-- ============================================================
-- REPLACE THESE WITH REAL auth.users UUIDs
-- ============================================================
do $$
declare
  coach_id   uuid := 'REPLACE_WITH_COACH_UUID';
  alex_id    uuid := 'REPLACE_WITH_ALEX_UUID';
  jordan_id  uuid := 'REPLACE_WITH_JORDAN_UUID';
  sam_id     uuid := 'REPLACE_WITH_SAM_UUID';
  taylor_id  uuid := 'REPLACE_WITH_TAYLOR_UUID';
  morgan_id  uuid := 'REPLACE_WITH_MORGAN_UUID';
  casey_id   uuid := 'REPLACE_WITH_CASEY_UUID';
  riley_id   uuid := 'REPLACE_WITH_RILEY_UUID';
  jamie_id   uuid := 'REPLACE_WITH_JAMIE_UUID';

  team_id    uuid;
  today      date := current_date;
begin

-- ============================================================
-- TEAM
-- ============================================================
insert into teams (id, name, invite_code, sport, division, season_start, season_end, coach_id)
values (
  uuid_generate_v4(),
  'UC Berkeley Men''s Rowing',
  'CAL-ROW-2026',
  'Rowing',
  'NCAA D1',
  '2025-09-01',
  '2026-06-01',
  coach_id
)
on conflict (invite_code) do nothing
returning id into team_id;

-- If team already exists, get its id
if team_id is null then
  select id into team_id from teams where invite_code = 'CAL-ROW-2026';
end if;

-- ============================================================
-- PROFILES
-- ============================================================
insert into profiles (id, role, name, email, team_id) values
  (coach_id,  'coach',   'Mike Teti',      'coach@rowiq.demo',  team_id),
  (alex_id,   'athlete', 'Alex Chen',      'alex@rowiq.demo',   team_id),
  (jordan_id, 'athlete', 'Jordan Rivera',  'jordan@rowiq.demo', team_id),
  (sam_id,    'athlete', 'Sam Park',       'sam@rowiq.demo',    team_id),
  (taylor_id, 'athlete', 'Taylor Kim',     'taylor@rowiq.demo', team_id),
  (morgan_id, 'athlete', 'Morgan Walsh',   'morgan@rowiq.demo', team_id),
  (casey_id,  'athlete', 'Casey Liu',      'casey@rowiq.demo',  team_id),
  (riley_id,  'athlete', 'Riley Torres',   'riley@rowiq.demo',  team_id),
  (jamie_id,  'athlete', 'Jamie Scott',    'jamie@rowiq.demo',  team_id)
on conflict (id) do update set team_id = excluded.team_id, name = excluded.name;

-- ============================================================
-- ATHLETES
-- ============================================================
insert into athletes (id, year, boat_class, seat_position, height_cm, weight_kg, sleep_goal, injuries_text) values
  (alex_id,   'Junior',    'Varsity 8', 'Stroke', 193, 86,   8, 'Lower back tightness (recurring)'),
  (jordan_id, 'Senior',    'Varsity 8', '2-seat', 188, 82,   8, null),
  (sam_id,    'Sophomore', 'Varsity 8', '3-seat', 185, 79,   8, null),
  (taylor_id, 'Junior',    'JV 8',      'Stroke', 187, 80,   8, null),
  (morgan_id, 'Freshman',  'JV 8',      '2-seat', 183, 77,   8, null),
  (casey_id,  'Senior',    'Varsity 8', 'Cox',    165, 55,   7, null),
  (riley_id,  'Junior',    'Varsity 8', '4-seat', 190, 84,   8, null),
  (jamie_id,  'Sophomore', 'JV 8',      '3-seat', 186, 78,   8, null)
on conflict (id) do nothing;

-- ============================================================
-- ACADEMIC SCHEDULES
-- ============================================================
insert into academic_schedules (athlete_id, classes_per_day, hard_days, exam_weeks) values
  (sam_id, 3, array['Monday','Wednesday','Friday'],
   '[{"week":"Mar 10","subject":"Thermodynamics"},{"week":"Mar 17","subject":"Fluid Mechanics"}]'::jsonb)
on conflict do nothing;

-- ============================================================
-- SESSIONS (14 days: 7 past + today + 6 future)
-- ============================================================
insert into sessions (team_id, date, type, duration, intensity, warmup, main_set, cooldown,
                      target_split, stroke_rate, hr_zone, assigned_to, coach_notes, is_notes_public, created_by)
values
  (team_id, today - 7, 'Erg',          90,  'High',     '10 min easy', '4x2000m @ 2:02/500m, r20',    '10 min easy', '2:02/500m', 'r20', 'HR4', 'all', 'Key fitness test', true, coach_id),
  (team_id, today - 6, 'Water',        120, 'Moderate', '15 min easy', '3x5km steady state @ 18spm',  '10 min easy', '2:08/500m', 'r18', 'HR3', 'all', null, false, coach_id),
  (team_id, today - 5, 'Weights',      75,  'High',     null,           'Deadlift 4x5, Squat 4x5',     null,          null,        null,  null,  'all', null, false, coach_id),
  (team_id, today - 4, 'Rest',         0,   'Low',      null,           'Full rest day',                null,          null,        null,  null,  'all', 'Get extra sleep tonight', true, coach_id),
  (team_id, today - 3, 'Erg',          60,  'Moderate', '10 min easy', '3x20min @ 2:08/500m, r18',    '10 min easy', '2:08/500m', 'r18', 'HR3', 'all', null, false, coach_id),
  (team_id, today - 2, 'Water',        110, 'High',     '20 min easy', '2x6km race pace, 10 min rest', '15 min easy', '1:58/500m', 'r32', 'HR5', 'all', null, false, coach_id),
  (team_id, today - 1, 'Erg',          90,  'High',     '10 min easy', '4x2000m @ 2:02/500m, r20',    '10 min easy', '2:02/500m', 'r20', 'HR4', 'all', null, false, coach_id),
  (team_id, today,     'Erg',          90,  'High',     '10 min at low rate, focus on catch timing',
                                                          '4x2000m @ 2:02/500m, r20, 5 min rest between pieces',
                                                          '10 min easy rowing, stretching',
                                                          '2:02/500m', 'r20', 'HR4', 'all',
                                                          'This is a key fitness test. Trust your training.',
                                                          true, coach_id),
  (team_id, today + 1, 'Water',        120, 'Moderate', '15 min easy', '3x5km steady state @ 18spm',  '10 min easy', '2:08/500m', 'r18', 'HR3', 'all', null, false, coach_id),
  (team_id, today + 2, 'Weights',      75,  'High',     null,           'Deadlift 4x5, Back squat 4x5, Power clean 4x3', null, null, null, null, 'all', null, false, coach_id),
  (team_id, today + 3, 'Rest',         0,   'Low',      null,           'Full rest day — focus on recovery and sleep', null, null, null, null, 'all', null, false, coach_id),
  (team_id, today + 4, 'Erg',          75,  'Race Pace', '15 min easy', '3x1000m @ race pace, r34, full rest', '10 min easy', '1:56/500m', 'r34', 'HR5', 'all', null, false, coach_id),
  (team_id, today + 5, 'Water',        90,  'Moderate', '15 min easy', '4x4km @ 2:06/500m, r20',      '10 min easy', '2:06/500m', 'r20', 'HR3', 'all', null, false, coach_id),
  (team_id, today + 6, 'Cross Training', 60, 'Low',     null,           'Yoga + stretching + core',    null,          null,        null,  null,  'all', null, false, coach_id)
on conflict do nothing;

-- ============================================================
-- WELLNESS LOGS — 14 days of morning + post-session logs
-- (Alex: soreness streak; Jordan: low sleep; Sam: exam stress)
-- ============================================================
-- Helper variables for log generation
declare
  log_date date;
  i        int;
  athlete_ids uuid[] := array[alex_id, jordan_id, sam_id, taylor_id, morgan_id, casey_id, riley_id, jamie_id];
  aid      uuid;
  sid      uuid;
begin
  for i in 1..14 loop
    log_date := today - (14 - i);
    foreach aid in array athlete_ids loop
      -- Morning log
      insert into wellness_logs (athlete_id, log_type, created_at, data) values (
        aid, 'morning', (log_date || 'T07:15:00Z')::timestamptz,
        jsonb_build_object(
          'sleep_hours',       case
                                  when aid = jordan_id then 5.5
                                  when aid = alex_id   then 7.5
                                  else 7 + (i % 3) * 0.5
                               end,
          'sleep_quality',     case when aid = jordan_id then 2 else 3 end,
          'energy',            case when aid = jordan_id then 2 else 3 end,
          'has_soreness',      case when aid = alex_id and i > 4 then true else false end,
          'soreness_body_part', case when aid = alex_id and i > 4 then 'Lower Back' else null end,
          'soreness_level',    case when aid = alex_id and i > 4 then 3 else null end,
          'stress',            case when aid = sam_id then 4 else 2 end,
          'motivation',        3,
          'classes_today',     2,
          'assignments_due',   false,
          'exam_this_week',    case when aid = sam_id then true else false end
        )
      ) on conflict do nothing;

      -- Post-session log (not for rest days or future)
      if log_date < today then
        insert into wellness_logs (athlete_id, log_type, created_at, data) values (
          aid, 'post', (log_date || 'T20:00:00Z')::timestamptz,
          jsonb_build_object(
            'completion',     case when i % 7 = 3 then 'partial' else 'full' end,
            'rpe',            case when aid = jordan_id then 8 else 5 + (i % 4) end,
            'legs_fatigue',   3,
            'back_fatigue',   case when aid = alex_id then 4 else 2 end,
            'breathing',      3,
            'has_pain',       case when aid = alex_id and i > 4 then true else false end,
            'pain_body_part', case when aid = alex_id and i > 4 then 'Lower Back' else null end,
            'pain_level',     case when aid = alex_id and i > 4 then 3 else null end,
            'performance_feel', 'good',
            'recovery_status',  'moderate',
            'ready_tomorrow',   true
          )
        ) on conflict do nothing;
      end if;
    end loop;
  end loop;
end;

-- ============================================================
-- ALERTS
-- ============================================================
insert into alerts (athlete_id, coach_id, type, severity, data, created_at) values
  (alex_id,   coach_id, 'soreness_streak', 'high',   '{"streak_days":3,"body_part":"Lower Back"}'::jsonb, now()),
  (jordan_id, coach_id, 'low_sleep',       'high',   '{"sleep_hours":5.5,"session_intensity":"High"}'::jsonb, now()),
  (sam_id,    coach_id, 'exam_tomorrow',   'medium', '{"exam_subject":"Thermodynamics","stress_level":4}'::jsonb, now())
on conflict do nothing;

-- ============================================================
-- MESSAGES
-- ============================================================
insert into messages (sender_id, receiver_id, content, is_urgent, created_at) values
  (alex_id,   coach_id, 'Coach, my lower back is really bothering me today. Should I modify the erg pieces?', false, now() - interval '2 hours'),
  (coach_id,  alex_id,  'Thanks for flagging. Let''s do 2 pieces at low intensity and see how it feels. Stop if it sharpens.', false, now() - interval '90 minutes'),
  (sam_id,    coach_id, 'I have a thermo exam Friday. Can we talk about training intensity this week?', false, now() - interval '3 hours')
on conflict do nothing;

end $$;
