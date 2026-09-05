-- RowIQ Demo Seed — Run this ONCE in Supabase SQL Editor
-- Creates all demo auth users + full team data in one shot
--
-- Demo Credentials (password: Demo1234! for all)
--   coach@rowiq.demo   → Coach Demo (Head Coach)
--   alex@rowiq.demo    → Alex Chen
--   jordan@rowiq.demo  → Jordan Rivera
--   sam@rowiq.demo     → Sam Park
--   taylor@rowiq.demo  → Taylor Kim
--   morgan@rowiq.demo  → Morgan Walsh
--   casey@rowiq.demo   → Casey Liu
--   riley@rowiq.demo   → Riley Torres
--   jamie@rowiq.demo   → Jamie Scott

do $$
declare
  coach_id    uuid := 'dd4f1844-0a04-43b4-89a4-f55915210807';
  alex_id     uuid := '240d0dfc-1155-47f4-97f1-1a947f12ba08';
  jordan_id   uuid := 'a733fcaf-bf9d-47cb-81ca-a96d3b8e1128';
  sam_id      uuid := '65b9c5ee-1fd6-4679-86db-0bbc64ff59af';
  taylor_id   uuid := '56ee222b-d600-43fe-93c1-2ada89791ad3';
  morgan_id   uuid := 'ae79a4ee-f025-45c0-8274-ec87fea73d89';
  casey_id    uuid := 'c47ad617-c422-4fbc-b801-d1135bf50ebf';
  riley_id    uuid := 'abeab2f7-41e9-4843-8afe-24965eefab66';
  jamie_id    uuid := '3f0ecfaf-367f-4f52-b324-92d480eb75a6';

  pw_hash     text;
  v_team_id   uuid;
  today       date := current_date;
  log_date    date;
  i           int;
  athlete_ids uuid[];
  aid         uuid;

begin

-- ============================================================
-- STEP 1: Create auth users (idempotent — skip if exists)
-- ============================================================
pw_hash := crypt('Demo1234!', gen_salt('bf'));

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, role, aud, created_at, updated_at
)
values
  (coach_id,  '00000000-0000-0000-0000-000000000000', 'coach@rowiq.demo',  pw_hash, now(), '{"role":"coach"}'::jsonb,   'authenticated', 'authenticated', now(), now()),
  (alex_id,   '00000000-0000-0000-0000-000000000000', 'alex@rowiq.demo',   pw_hash, now(), '{"role":"athlete"}'::jsonb, 'authenticated', 'authenticated', now(), now()),
  (jordan_id, '00000000-0000-0000-0000-000000000000', 'jordan@rowiq.demo', pw_hash, now(), '{"role":"athlete"}'::jsonb, 'authenticated', 'authenticated', now(), now()),
  (sam_id,    '00000000-0000-0000-0000-000000000000', 'sam@rowiq.demo',    pw_hash, now(), '{"role":"athlete"}'::jsonb, 'authenticated', 'authenticated', now(), now()),
  (taylor_id, '00000000-0000-0000-0000-000000000000', 'taylor@rowiq.demo', pw_hash, now(), '{"role":"athlete"}'::jsonb, 'authenticated', 'authenticated', now(), now()),
  (morgan_id, '00000000-0000-0000-0000-000000000000', 'morgan@rowiq.demo', pw_hash, now(), '{"role":"athlete"}'::jsonb, 'authenticated', 'authenticated', now(), now()),
  (casey_id,  '00000000-0000-0000-0000-000000000000', 'casey@rowiq.demo',  pw_hash, now(), '{"role":"athlete"}'::jsonb, 'authenticated', 'authenticated', now(), now()),
  (riley_id,  '00000000-0000-0000-0000-000000000000', 'riley@rowiq.demo',  pw_hash, now(), '{"role":"athlete"}'::jsonb, 'authenticated', 'authenticated', now(), now()),
  (jamie_id,  '00000000-0000-0000-0000-000000000000', 'jamie@rowiq.demo',  pw_hash, now(), '{"role":"athlete"}'::jsonb, 'authenticated', 'authenticated', now(), now())
on conflict (id) do nothing;

-- Also insert into auth.identities (required for email login)
insert into auth.identities (
  id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
)
values
  (gen_random_uuid(), coach_id,  jsonb_build_object('sub', coach_id::text,  'email', 'coach@rowiq.demo'),  'email', now(), now(), now(), 'coach@rowiq.demo'),
  (gen_random_uuid(), alex_id,   jsonb_build_object('sub', alex_id::text,   'email', 'alex@rowiq.demo'),   'email', now(), now(), now(), 'alex@rowiq.demo'),
  (gen_random_uuid(), jordan_id, jsonb_build_object('sub', jordan_id::text, 'email', 'jordan@rowiq.demo'), 'email', now(), now(), now(), 'jordan@rowiq.demo'),
  (gen_random_uuid(), sam_id,    jsonb_build_object('sub', sam_id::text,    'email', 'sam@rowiq.demo'),    'email', now(), now(), now(), 'sam@rowiq.demo'),
  (gen_random_uuid(), taylor_id, jsonb_build_object('sub', taylor_id::text, 'email', 'taylor@rowiq.demo'), 'email', now(), now(), now(), 'taylor@rowiq.demo'),
  (gen_random_uuid(), morgan_id, jsonb_build_object('sub', morgan_id::text, 'email', 'morgan@rowiq.demo'), 'email', now(), now(), now(), 'morgan@rowiq.demo'),
  (gen_random_uuid(), casey_id,  jsonb_build_object('sub', casey_id::text,  'email', 'casey@rowiq.demo'),  'email', now(), now(), now(), 'casey@rowiq.demo'),
  (gen_random_uuid(), riley_id,  jsonb_build_object('sub', riley_id::text,  'email', 'riley@rowiq.demo'),  'email', now(), now(), now(), 'riley@rowiq.demo'),
  (gen_random_uuid(), jamie_id,  jsonb_build_object('sub', jamie_id::text,  'email', 'jamie@rowiq.demo'),  'email', now(), now(), now(), 'jamie@rowiq.demo')
on conflict (provider, provider_id) do nothing;

-- Ensure profiles exist (trigger may not fire for direct inserts)
insert into profiles (id, role, name, email, status)
values
  (coach_id,  'coach',   'Coach Demo',     'coach@rowiq.demo',  'active'),
  (alex_id,   'athlete', 'Alex Chen',     'alex@rowiq.demo',   'active'),
  (jordan_id, 'athlete', 'Jordan Rivera', 'jordan@rowiq.demo', 'active'),
  (sam_id,    'athlete', 'Sam Park',      'sam@rowiq.demo',    'active'),
  (taylor_id, 'athlete', 'Taylor Kim',    'taylor@rowiq.demo', 'active'),
  (morgan_id, 'athlete', 'Morgan Walsh',  'morgan@rowiq.demo', 'active'),
  (casey_id,  'athlete', 'Casey Liu',     'casey@rowiq.demo',  'active'),
  (riley_id,  'athlete', 'Riley Torres',  'riley@rowiq.demo',  'active'),
  (jamie_id,  'athlete', 'Jamie Scott',   'jamie@rowiq.demo',  'active')
on conflict (id) do update set
  role   = excluded.role,
  name   = excluded.name,
  email  = excluded.email,
  status = excluded.status;

-- ============================================================
-- STEP 2: Team
-- ============================================================
insert into teams (name, invite_code, sport, division, season_start, season_end, coach_id)
values (
  'Demo Rowing Club',
  'CAL-ROW-2026',
  'Rowing',
  'NCAA D1',
  '2025-09-01',
  '2026-06-01',
  coach_id
)
on conflict (invite_code) do update set coach_id = excluded.coach_id
returning id into v_team_id;

if v_team_id is null then
  select id into v_team_id from teams where invite_code = 'CAL-ROW-2026';
end if;

-- ============================================================
-- STEP 3: Link profiles to team
-- ============================================================
update profiles set team_id = v_team_id where id in (
  coach_id, alex_id, jordan_id, sam_id, taylor_id, morgan_id, casey_id, riley_id, jamie_id
);

-- ============================================================
-- STEP 4: Athlete rows
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
-- STEP 5: Academic schedule (Sam)
-- ============================================================
insert into academic_schedules (athlete_id, classes_per_day, hard_days, exam_weeks)
values (
  sam_id, 3,
  array['Monday','Wednesday','Friday'],
  '[{"week":"Mar 10","subject":"Thermodynamics"},{"week":"Mar 17","subject":"Fluid Mechanics"}]'::jsonb
)
on conflict do nothing;

-- ============================================================
-- STEP 6: Sessions (7 past + today + 6 future)
-- ============================================================
insert into sessions (team_id, date, type, duration, intensity, warmup, main_set, cooldown,
                      target_split, stroke_rate, hr_zone, assigned_to, coach_notes, is_notes_public, created_by)
values
  (v_team_id, today-7, 'Erg',           90,  'High',      '10 min easy',     '4x2000m @ 2:02/500m, r20',                              '10 min easy', '2:02/500m','r20','HR4','all','Key fitness test',                          true,  coach_id),
  (v_team_id, today-6, 'Water',         120, 'Moderate',  '15 min easy',     '3x5km steady state @ 18spm, focus on ratio',            '10 min easy', '2:08/500m','r18','HR3','all', null,                                        false, coach_id),
  (v_team_id, today-5, 'Weights',       75,  'High',       null,             'Deadlift 4x5, Back squat 4x5, Power clean 4x3',         null,           null,       null,  null, 'all', null,                                        false, coach_id),
  (v_team_id, today-4, 'Rest',          0,   'Low',        null,             'Full rest day',                                         null,           null,       null,  null, 'all','Get extra sleep tonight',                   true,  coach_id),
  (v_team_id, today-3, 'Erg',           60,  'Moderate',  '10 min easy',     '3x20min @ 2:08/500m, r18, HR zone 3',                  '10 min easy', '2:08/500m','r18','HR3','all', null,                                        false, coach_id),
  (v_team_id, today-2, 'Water',         110, 'High',      '20 min easy',     '2x6km race pace, 10 min rest',                         '15 min easy', '1:58/500m','r32','HR5','all', null,                                        false, coach_id),
  (v_team_id, today-1, 'Erg',           90,  'High',      '10 min easy',     '4x2000m @ 2:02/500m, r20',                             '10 min easy', '2:02/500m','r20','HR4','all', null,                                        false, coach_id),
  (v_team_id, today,   'Erg',           90,  'High',      '10 min at low rate, focus on catch timing',
                                                          '4x2000m @ 2:02/500m, r20, 5 min rest between pieces',
                                                          '10 min easy rowing, stretching',                        '2:02/500m','r20','HR4','all','This is a key fitness test. Trust your training.', true, coach_id),
  (v_team_id, today+1, 'Water',         120, 'Moderate',  '15 min easy',     '3x5km steady state @ 18spm',                           '10 min easy', '2:08/500m','r18','HR3','all', null,                                        false, coach_id),
  (v_team_id, today+2, 'Weights',       75,  'High',       null,             'Deadlift 4x5, Back squat 4x5, Power clean 4x3',         null,           null,       null,  null, 'all', null,                                        false, coach_id),
  (v_team_id, today+3, 'Rest',          0,   'Low',        null,             'Full rest day — focus on recovery and sleep',            null,           null,       null,  null, 'all', null,                                        false, coach_id),
  (v_team_id, today+4, 'Erg',           75,  'Race Pace', '15 min easy',     '3x1000m @ race pace, r34, full rest',                  '10 min easy', '1:56/500m','r34','HR5','all', null,                                        false, coach_id),
  (v_team_id, today+5, 'Water',         90,  'Moderate',  '15 min easy',     '4x4km @ 2:06/500m, r20',                               '10 min easy', '2:06/500m','r20','HR3','all', null,                                        false, coach_id),
  (v_team_id, today+6, 'Cross Training',60,  'Low',        null,             'Yoga + stretching + core',                              null,           null,       null,  null, 'all', null,                                        false, coach_id)
on conflict do nothing;

-- ============================================================
-- STEP 7: Wellness logs — 14 days
-- ============================================================
athlete_ids := array[alex_id, jordan_id, sam_id, taylor_id, morgan_id, casey_id, riley_id, jamie_id];

for i in 1..14 loop
  log_date := today - (14 - i);

  foreach aid in array athlete_ids loop

    insert into wellness_logs (athlete_id, log_type, created_at, data)
    values (
      aid, 'morning',
      (log_date::text || 'T07:15:00Z')::timestamptz,
      jsonb_build_object(
        'sleep_hours',        case when aid = jordan_id then 5.5 when aid = alex_id then 7.5 else 7 + (i % 3) * 0.5 end,
        'sleep_quality',      case when aid = jordan_id then 2 else 3 end,
        'energy',             case when aid = jordan_id then 2 else 3 end,
        'has_soreness',       (aid = alex_id and i > 4),
        'soreness_body_part', case when aid = alex_id and i > 4 then 'Lower Back' else null end,
        'soreness_level',     case when aid = alex_id and i > 4 then 3 else null end,
        'stress',             case when aid = sam_id then 4 else 2 end,
        'motivation',         3,
        'classes_today',      2,
        'assignments_due',    false,
        'exam_this_week',     (aid = sam_id)
      )
    )
    on conflict do nothing;

    if log_date < today then
      insert into wellness_logs (athlete_id, log_type, created_at, data)
      values (
        aid, 'post',
        (log_date::text || 'T20:00:00Z')::timestamptz,
        jsonb_build_object(
          'completion',       case when i % 7 = 3 then 'partial' else 'full' end,
          'rpe',              case when aid = jordan_id then 8 else 5 + (i % 4) end,
          'legs_fatigue',     3,
          'back_fatigue',     case when aid = alex_id then 4 else 2 end,
          'breathing',        3,
          'has_pain',         (aid = alex_id and i > 4),
          'pain_body_part',   case when aid = alex_id and i > 4 then 'Lower Back' else null end,
          'pain_level',       case when aid = alex_id and i > 4 then 3 else null end,
          'performance_feel', 'good',
          'recovery_status',  'moderate',
          'ready_tomorrow',   true
        )
      )
      on conflict do nothing;
    end if;

  end loop;
end loop;

-- ============================================================
-- STEP 8: Alerts
-- ============================================================
insert into alerts (athlete_id, coach_id, type, severity, data, created_at) values
  (alex_id,   coach_id, 'soreness_streak', 'high',   '{"streak_days":3,"body_part":"Lower Back"}'::jsonb,         now()),
  (jordan_id, coach_id, 'low_sleep',       'high',   '{"sleep_hours":5.5,"session_intensity":"High"}'::jsonb,     now()),
  (sam_id,    coach_id, 'exam_tomorrow',   'medium', '{"exam_subject":"Thermodynamics","stress_level":4}'::jsonb, now())
on conflict do nothing;

-- ============================================================
-- STEP 9: Messages
-- ============================================================
insert into messages (sender_id, receiver_id, content, is_urgent, created_at) values
  (alex_id,  coach_id, 'Coach, my lower back is really bothering me today. Should I modify the erg pieces?',                        false, now() - interval '2 hours'),
  (coach_id, alex_id,  'Thanks for flagging. Let''s do 2 pieces at low intensity and see how it feels. Stop if it sharpens.',        false, now() - interval '90 minutes'),
  (sam_id,   coach_id, 'I have a thermo exam Friday. Can we talk about training intensity this week?',                               false, now() - interval '3 hours')
on conflict do nothing;

raise notice 'Demo seed complete. All 9 users ready with password: Demo1234!';

end $$;
