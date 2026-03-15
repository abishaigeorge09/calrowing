-- Add account status to profiles
alter table profiles
  add column if not exists status text not null default 'active'
  check (status in ('pending', 'active', 'suspended', 'rejected'));

-- Expand role constraint to include superadmin
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check
  check (role in ('coach', 'athlete', 'superadmin'));

-- Coaches registered via sign-up start as pending
-- (handled in app layer by updating status after insert)

-- Superadmin can read all profiles
-- Uses get_my_role() (security definer) to avoid RLS recursion
create policy "Superadmin reads all profiles"
  on profiles for select
  to authenticated
  using (
    get_my_role() = 'superadmin'
    or id = auth.uid()
    or team_id = get_my_team_id()
  );

-- Superadmin can update any profile (e.g. approve/suspend)
-- Uses get_my_role() (security definer) to avoid RLS recursion
create policy "Superadmin updates profiles"
  on profiles for update
  to authenticated
  using (get_my_role() = 'superadmin');

-- Superadmin can read all teams
-- Uses get_my_role() (security definer) to avoid RLS recursion
create policy "Superadmin reads all teams"
  on teams for select
  to authenticated
  using (
    get_my_role() = 'superadmin'
    or coach_id = auth.uid()
    or id = get_my_team_id()
  );
