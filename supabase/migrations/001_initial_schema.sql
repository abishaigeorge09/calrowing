-- RowIQ Initial Schema Migration
-- Run this against your Supabase project via the SQL Editor or CLI

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TEAMS
-- ============================================================
create table if not exists teams (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  invite_code   text not null unique,
  sport         text not null default 'Rowing',
  division      text,
  season_start  date,
  season_end    date,
  coach_id      uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- PROFILES  (extends auth.users)
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('coach', 'athlete')),
  name        text not null,
  email       text not null,
  team_id     uuid references teams(id) on delete set null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- ATHLETES  (extra info beyond profile)
-- ============================================================
create table if not exists athletes (
  id              uuid primary key references profiles(id) on delete cascade,
  year            text,           -- Freshman / Sophomore / Junior / Senior / Grad
  boat_class      text,           -- Varsity 8 / JV 8 / etc.
  seat_position   text,           -- Stroke / 2-seat / Cox / etc.
  height_cm       int,
  weight_kg       numeric(5,1),
  sleep_goal      int not null default 8,
  injuries_text   text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- ACADEMIC SCHEDULES
-- ============================================================
create table if not exists academic_schedules (
  id              uuid primary key default uuid_generate_v4(),
  athlete_id      uuid not null references athletes(id) on delete cascade,
  classes_per_day int not null default 2,
  hard_days       text[] not null default '{}',   -- e.g. ['Monday','Wednesday']
  exam_weeks      jsonb,                            -- [{week: 'Mar 10', subject: 'Thermo'}]
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- TRAINING SESSIONS
-- ============================================================
create table if not exists sessions (
  id              uuid primary key default uuid_generate_v4(),
  team_id         uuid not null references teams(id) on delete cascade,
  date            date not null,
  type            text not null check (type in ('Erg', 'Water', 'Weights', 'Cross Training', 'Rest')),
  duration        int,              -- minutes
  intensity       text not null check (intensity in ('Low', 'Moderate', 'High', 'Race Pace')),
  warmup          text,
  main_set        text,
  cooldown        text,
  target_split    text,             -- e.g. "2:02/500m"
  stroke_rate     text,             -- e.g. "r20"
  hr_zone         text,
  assigned_to     text,             -- 'all' | 'varsity' | 'jv' | athlete_id
  coach_notes     text,
  is_notes_public boolean not null default false,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- WELLNESS LOGS  (morning / post-session / evening)
-- ============================================================
create table if not exists wellness_logs (
  id          uuid primary key default uuid_generate_v4(),
  athlete_id  uuid not null references athletes(id) on delete cascade,
  session_id  uuid references sessions(id) on delete set null,
  log_type    text not null check (log_type in ('morning', 'post', 'evening')),
  data        jsonb not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists messages (
  id          uuid primary key default uuid_generate_v4(),
  sender_id   uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  content     text not null,
  is_urgent   boolean not null default false,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- ALERTS
-- ============================================================
create table if not exists alerts (
  id           uuid primary key default uuid_generate_v4(),
  athlete_id   uuid not null references athletes(id) on delete cascade,
  coach_id     uuid not null references profiles(id) on delete cascade,
  type         text not null check (type in ('soreness_streak', 'low_sleep', 'injury', 'exam_tomorrow')),
  severity     text not null check (severity in ('low', 'medium', 'high')),
  data         jsonb,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- INJURIES
-- ============================================================
create table if not exists injuries (
  id          uuid primary key default uuid_generate_v4(),
  athlete_id  uuid not null references athletes(id) on delete cascade,
  body_part   text not null,
  severity    text not null check (severity in ('Mild', 'Moderate', 'Severe')),
  description text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists wellness_logs_athlete_id_idx on wellness_logs(athlete_id);
create index if not exists wellness_logs_created_at_idx on wellness_logs(created_at desc);
create index if not exists messages_sender_receiver_idx on messages(sender_id, receiver_id);
create index if not exists alerts_athlete_id_idx on alerts(athlete_id);
create index if not exists sessions_team_date_idx on sessions(team_id, date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table teams            enable row level security;
alter table profiles         enable row level security;
alter table athletes         enable row level security;
alter table academic_schedules enable row level security;
alter table sessions         enable row level security;
alter table wellness_logs    enable row level security;
alter table messages         enable row level security;
alter table alerts           enable row level security;
alter table injuries         enable row level security;

-- Helper: get current user's profile role + team_id
create or replace function get_my_role()
returns text language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function get_my_team_id()
returns uuid language sql security definer stable as $$
  select team_id from profiles where id = auth.uid()
$$;

-- TEAMS: coaches see own team; athletes see their team
create policy "teams_select" on teams for select using (
  id = get_my_team_id()
);
create policy "teams_insert" on teams for insert with check (
  get_my_role() = 'coach'
);

-- PROFILES: own row + teammates
create policy "profiles_select" on profiles for select using (
  id = auth.uid() or team_id = get_my_team_id()
);
create policy "profiles_insert" on profiles for insert with check (
  id = auth.uid()
);
create policy "profiles_update" on profiles for update using (
  id = auth.uid()
);

-- ATHLETES: own row; coaches see team's athletes
create policy "athletes_select" on athletes for select using (
  id = auth.uid() or
  id in (select id from profiles where team_id = get_my_team_id())
);
create policy "athletes_insert" on athletes for insert with check (
  id = auth.uid()
);
create policy "athletes_update" on athletes for update using (
  id = auth.uid()
);

-- ACADEMIC SCHEDULES: own; coaches see team's
create policy "academic_select" on academic_schedules for select using (
  athlete_id = auth.uid() or
  athlete_id in (select id from profiles where team_id = get_my_team_id())
);
create policy "academic_insert" on academic_schedules for insert with check (
  athlete_id = auth.uid()
);
create policy "academic_update" on academic_schedules for update using (
  athlete_id = auth.uid()
);

-- SESSIONS: team members can read; only coaches can write
create policy "sessions_select" on sessions for select using (
  team_id = get_my_team_id()
);
create policy "sessions_insert" on sessions for insert with check (
  get_my_role() = 'coach' and team_id = get_my_team_id()
);
create policy "sessions_update" on sessions for update using (
  get_my_role() = 'coach' and team_id = get_my_team_id()
);

-- WELLNESS LOGS: own data; coaches see all team's
create policy "wellness_select" on wellness_logs for select using (
  athlete_id = auth.uid() or
  athlete_id in (select id from profiles where team_id = get_my_team_id())
);
create policy "wellness_insert" on wellness_logs for insert with check (
  athlete_id = auth.uid()
);

-- MESSAGES: sender or receiver
create policy "messages_select" on messages for select using (
  sender_id = auth.uid() or receiver_id = auth.uid()
);
create policy "messages_insert" on messages for insert with check (
  sender_id = auth.uid()
);

-- ALERTS: own alerts; coaches see team's
create policy "alerts_select" on alerts for select using (
  athlete_id = auth.uid() or coach_id = auth.uid()
);
create policy "alerts_insert" on alerts for insert with check (
  get_my_role() = 'coach' or athlete_id = auth.uid()
);
create policy "alerts_update" on alerts for update using (
  coach_id = auth.uid()
);

-- INJURIES: own; coaches see team's
create policy "injuries_select" on injuries for select using (
  athlete_id = auth.uid() or
  athlete_id in (select id from profiles where team_id = get_my_team_id())
);
create policy "injuries_insert" on injuries for insert with check (
  athlete_id = auth.uid()
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, role, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'athlete'),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
