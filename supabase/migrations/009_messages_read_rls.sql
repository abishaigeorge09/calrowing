-- Migration 009: Allow receivers to mark messages as read
-- Fixes the "unread badge never clears" bug caused by missing UPDATE RLS policy.

-- Receivers can update read_at on messages sent to them.
-- Senders cannot modify their own sent messages (no update on sender side).
drop policy if exists "messages_update" on messages;
create policy "messages_update" on messages for update
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());
