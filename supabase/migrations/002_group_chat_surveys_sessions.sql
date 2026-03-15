-- RowIQ Migration 002
-- Adds: chat groups, surveys, session columns, and fixes messages schema

-- ============================================================
-- CHAT GROUPS
-- ============================================================
create table if not exists chat_groups (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  team_id    uuid not null references teams(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists chat_group_members (
  group_id   uuid not null references chat_groups(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (group_id, profile_id)
);

-- ============================================================
-- MESSAGES — make receiver_id nullable, add group_id
-- ============================================================
alter table messages alter column receiver_id drop not null;

alter table messages
  add column if not exists group_id uuid references chat_groups(id) on delete cascade;

-- Add constraint: must have either receiver_id (DM) or group_id (group), not both null
alter table messages drop constraint if exists messages_recipient_check;
alter table messages
  add constraint messages_recipient_check
  check (receiver_id is not null or group_id is not null);

create index if not exists messages_group_id_idx on messages(group_id);

-- ============================================================
-- MESSAGES RLS — update to include group messages
-- ============================================================
drop policy if exists "messages_select" on messages;
create policy "messages_select" on messages for select using (
  sender_id = auth.uid()
  or receiver_id = auth.uid()
  or group_id in (
    select group_id from chat_group_members where profile_id = auth.uid()
  )
);

drop policy if exists "messages_insert" on messages;
create policy "messages_insert" on messages for insert with check (
  sender_id = auth.uid()
  and (
    receiver_id is not null
    or group_id in (
      select group_id from chat_group_members where profile_id = auth.uid()
    )
  )
);

alter table messages
  add column if not exists read_at timestamptz;

-- ============================================================
-- CHAT GROUPS RLS
-- ============================================================
alter table chat_groups enable row level security;
alter table chat_group_members enable row level security;

-- Security-definer helper: reads chat_group_members WITHOUT applying its own RLS.
-- This breaks the infinite-recursion cycle that occurs when any RLS policy
-- on chat_groups or chat_group_members queries chat_group_members.
create or replace function get_my_group_ids()
returns setof uuid
language sql security definer stable
set search_path = public
as $$
  select group_id from chat_group_members where profile_id = auth.uid();
$$;

-- chat_groups: visible if you created it OR you are a member
drop policy if exists "chat_groups_select" on chat_groups;
create policy "chat_groups_select" on chat_groups for select using (
  created_by = auth.uid()
  or id in (select get_my_group_ids())
);

drop policy if exists "chat_groups_insert" on chat_groups;
create policy "chat_groups_insert" on chat_groups for insert with check (
  team_id = get_my_team_id()
);

-- chat_group_members: your own rows, plus rows for groups you belong to
drop policy if exists "chat_group_members_select" on chat_group_members;
create policy "chat_group_members_select" on chat_group_members for select using (
  profile_id = auth.uid()
  or group_id in (select get_my_group_ids())
);

-- Only the group creator can add members (creator_id is checked via chat_groups
-- which is visible to the creator via the "created_by = auth.uid()" policy above)
drop policy if exists "chat_group_members_insert" on chat_group_members;
create policy "chat_group_members_insert" on chat_group_members for insert with check (
  exists (
    select 1 from chat_groups
    where id = group_id
      and created_by = auth.uid()
  )
);

-- ============================================================
-- SESSIONS — add missing columns
-- ============================================================
alter table sessions
  add column if not exists start_time time,
  add column if not exists end_time   time,
  add column if not exists media_urls jsonb default '[]'::jsonb;

-- Fix type constraint to include Assessment
alter table sessions drop constraint if exists sessions_type_check;
alter table sessions
  add constraint sessions_type_check
  check (type in ('Erg', 'Water', 'Weights', 'Cross Training', 'Rest', 'Assessment'));

-- ============================================================
-- SURVEYS
-- ============================================================
create table if not exists surveys (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid not null references teams(id) on delete cascade,
  coach_id    uuid references profiles(id) on delete set null,
  title       text not null,
  description text,
  questions   jsonb not null default '[]'::jsonb,
  is_template boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists survey_assignments (
  id           uuid primary key default uuid_generate_v4(),
  survey_id    uuid not null references surveys(id) on delete cascade,
  athlete_id   uuid references profiles(id) on delete cascade,
  team_id      uuid not null references teams(id) on delete cascade,
  assigned_at  timestamptz not null default now(),
  due_at       timestamptz,
  completed_at timestamptz
);

create table if not exists survey_responses (
  id            uuid primary key default uuid_generate_v4(),
  survey_id     uuid not null references surveys(id) on delete cascade,
  assignment_id uuid references survey_assignments(id) on delete set null,
  athlete_id    uuid not null references profiles(id) on delete cascade,
  answers       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists survey_assignments_athlete_idx on survey_assignments(athlete_id);
create index if not exists survey_assignments_survey_idx  on survey_assignments(survey_id);
create index if not exists survey_responses_survey_idx    on survey_responses(survey_id);

-- ============================================================
-- SURVEYS RLS
-- ============================================================
alter table surveys            enable row level security;
alter table survey_assignments enable row level security;
alter table survey_responses   enable row level security;

drop policy if exists "surveys_select" on surveys;
create policy "surveys_select" on surveys for select using (
  team_id = get_my_team_id()
);
drop policy if exists "surveys_insert" on surveys;
create policy "surveys_insert" on surveys for insert with check (
  get_my_role() = 'coach' and team_id = get_my_team_id()
);

drop policy if exists "survey_assignments_select" on survey_assignments;
create policy "survey_assignments_select" on survey_assignments for select using (
  athlete_id = auth.uid()
  or team_id = get_my_team_id()
);
drop policy if exists "survey_assignments_insert" on survey_assignments;
create policy "survey_assignments_insert" on survey_assignments for insert with check (
  get_my_role() = 'coach' and team_id = get_my_team_id()
);
drop policy if exists "survey_assignments_update" on survey_assignments;
create policy "survey_assignments_update" on survey_assignments for update using (
  athlete_id = auth.uid() or get_my_role() = 'coach'
);

drop policy if exists "survey_responses_select" on survey_responses;
create policy "survey_responses_select" on survey_responses for select using (
  athlete_id = auth.uid()
  or survey_id in (select id from surveys where team_id = get_my_team_id())
);
drop policy if exists "survey_responses_insert" on survey_responses;
create policy "survey_responses_insert" on survey_responses for insert with check (
  athlete_id = auth.uid()
);
