-- Supabase Migration: 008_group_chats.sql (FIXED V2)
-- Adds support for group chats and fixes RLS recursion issues.

-- 1. Fix the team helper function to be bulletproof against recursion
-- By explicitly setting search_path and ensuring it's security definer, 
-- it will bypass RLS when looking up the current user's team.
create or replace function get_my_team_id()
returns uuid language sql security definer set search_path = public stable as $$
  select team_id from profiles where id = auth.uid();
$$;

-- 2. Fix Recursion in profiles_select
-- We simplify this to use our fixed function.
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles for select using (
  id = auth.uid() or 
  team_id = get_my_team_id()
);

-- 3. Create Chat Groups Table
create table if not exists chat_groups (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid not null references teams(id) on delete cascade,
  name        text not null,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- 4. Create Chat Group Members Table
create table if not exists chat_group_members (
  group_id    uuid not null references chat_groups(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (group_id, profile_id)
);

-- 5. Safely Modify Messages Table
DO $$ 
BEGIN 
  -- Drop constraint if exists to avoid errors on retry
  alter table messages drop constraint if exists messages_target_check;

  -- Make receiver_id nullable
  alter table messages alter column receiver_id drop not null;

  -- Add group_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='group_id') THEN
    alter table messages add column group_id uuid references chat_groups(id) on delete cascade;
  END IF;

  -- Add constraint
  alter table messages 
    add constraint messages_target_check 
    check (
      (receiver_id is not null and group_id is null) or 
      (receiver_id is null and group_id is not null)
    );
END $$;

create index if not exists messages_group_id_idx on messages(group_id);

-- 6. RLS for Chat Groups
alter table chat_groups enable row level security;
alter table chat_group_members enable row level security;

drop policy if exists "chat_groups_select" on chat_groups;
create policy "chat_groups_select" on chat_groups for select using (
  team_id = get_my_team_id()
);

drop policy if exists "chat_groups_insert" on chat_groups;
create policy "chat_groups_insert" on chat_groups for insert with check (
  team_id = get_my_team_id()
);

-- 7. RLS for Chat Group Members
drop policy if exists "chat_group_members_select" on chat_group_members;
create policy "chat_group_members_select" on chat_group_members for select using (
  group_id in (
    select id from chat_groups 
    where team_id = get_my_team_id()
  )
);

drop policy if exists "chat_group_members_insert" on chat_group_members;
create policy "chat_group_members_insert" on chat_group_members for insert with check (
  group_id in (
    select id from chat_groups 
    where team_id = get_my_team_id()
  )
);

-- 8. RLS for Messages
drop policy if exists "messages_select" on messages;
create policy "messages_select" on messages for select using (
  sender_id = auth.uid() or 
  receiver_id = auth.uid() or 
  group_id in (select group_id from chat_group_members where profile_id = auth.uid())
);

drop policy if exists "messages_insert" on messages;
create policy "messages_insert" on messages for insert with check (
  sender_id = auth.uid() and (
    receiver_id is not null or
    group_id in (select group_id from chat_group_members where profile_id = auth.uid())
  )
);
