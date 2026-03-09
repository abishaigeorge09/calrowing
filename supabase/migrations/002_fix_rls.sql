-- Fix 1: Allow unauthenticated users to look up teams by invite code.
-- Team names and invite codes are not sensitive — athletes need to verify
-- their code before they have an account.
drop policy if exists "teams_select" on teams;
create policy "teams_select" on teams for select using (true);

-- Fix 2: Allow newly-signed-up users (whose profile may not have a team_id yet)
-- to update their own profile's team_id during onboarding.
-- The existing profiles_update policy uses "using (id = auth.uid())" which should
-- already cover this — no change needed there.
