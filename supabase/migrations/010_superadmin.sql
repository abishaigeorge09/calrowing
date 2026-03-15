-- Add account status to profiles
alter table profiles
  add column if not exists status text not null default 'active'
  check (status in ('pending', 'active', 'suspended'));

-- Expand role constraint to include superadmin
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check
  check (role in ('coach', 'athlete', 'superadmin'));

-- Coaches registered via sign-up start as pending
-- (handled in app layer by updating status after insert)

-- Superadmin can read all profiles
create policy "Superadmin reads all profiles"
  on profiles for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'superadmin'
    )
    or id = auth.uid()
    or (
      select team_id from profiles where id = auth.uid()
    ) = team_id
  );

-- Superadmin can update any profile (e.g. approve/suspend)
create policy "Superadmin updates profiles"
  on profiles for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'superadmin'
    )
  );

-- Superadmin can read all teams
create policy "Superadmin reads all teams"
  on teams for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'superadmin'
    )
    or coach_id = auth.uid()
    or id = (select team_id from profiles where id = auth.uid())
  );
