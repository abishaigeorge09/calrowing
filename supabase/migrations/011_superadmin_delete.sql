-- Allow superadmin to delete any profile (e.g. remove a rogue athlete)
create policy "Superadmin deletes profiles"
  on profiles for delete
  to authenticated
  using (get_my_role() = 'superadmin');

-- Allow superadmin to delete any team
create policy "Superadmin deletes teams"
  on teams for delete
  to authenticated
  using (get_my_role() = 'superadmin');

-- Allow superadmin to update any team (e.g. unlink profiles before deletion)
create policy "Superadmin updates teams"
  on teams for update
  to authenticated
  using (get_my_role() = 'superadmin');
