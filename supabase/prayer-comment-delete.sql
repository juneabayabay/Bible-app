-- Allow users to remove their own prayer-wall comments (same device_id).
-- Run once in Supabase SQL editor.

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

revoke all on function delete_own_prayer_comment(uuid, text) from public;
grant execute on function delete_own_prayer_comment(uuid, text) to anon, authenticated;
