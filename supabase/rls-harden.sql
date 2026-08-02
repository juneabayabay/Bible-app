-- Harden RLS for an already-deployed Bible-app project.
-- Run once in Supabase SQL editor after deploying the app update.

-- —— Feedback: insert-only for anon (no public read) ——
drop policy if exists "app_feedback_select" on app_feedback;
revoke select on table app_feedback from anon, authenticated;
-- Keep insert for the public form
grant insert on table app_feedback to anon, authenticated;

-- —— Prayer wall: revoke open deletes; use RPC ——
drop policy if exists "prayer_requests_delete_own" on prayer_requests;
drop policy if exists "prayer_reactions_delete" on prayer_reactions;
revoke delete on table prayer_requests from anon, authenticated;
revoke delete on table prayer_reactions from anon, authenticated;
revoke delete on table prayer_comments from anon, authenticated;

create or replace function delete_own_prayer_request(p_id uuid, p_device_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_device_id is null or char_length(trim(p_device_id)) < 8 then
    raise exception 'invalid device';
  end if;
  delete from prayer_requests
  where id = p_id and device_id = p_device_id;
end;
$$;

create or replace function delete_own_prayer_reaction(p_id uuid, p_device_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_device_id is null or char_length(trim(p_device_id)) < 8 then
    raise exception 'invalid device';
  end if;
  delete from prayer_reactions
  where id = p_id and device_id = p_device_id;
end;
$$;

create or replace function delete_own_prayer_comment(p_id uuid, p_device_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_device_id is null or char_length(trim(p_device_id)) < 8 then
    raise exception 'invalid device';
  end if;
  delete from prayer_comments
  where id = p_id and device_id = p_device_id;
end;
$$;

revoke all on function delete_own_prayer_request(uuid, text) from public;
revoke all on function delete_own_prayer_reaction(uuid, text) from public;
revoke all on function delete_own_prayer_comment(uuid, text) from public;
grant execute on function delete_own_prayer_request(uuid, text) to anon, authenticated;
grant execute on function delete_own_prayer_reaction(uuid, text) to anon, authenticated;
grant execute on function delete_own_prayer_comment(uuid, text) to anon, authenticated;
