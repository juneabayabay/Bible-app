-- Prayer wall schema for Bible-app
-- Run this ENTIRE script in the Supabase SQL editor (Dashboard → SQL),
-- then set PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY in .env
-- Prefer the legacy "anon" JWT key (eyJ…) OR a publishable key (sb_publishable_…).
--
-- Security notes:
-- - Public can SELECT + INSERT.
-- - DELETE goes through RPC helpers that require matching device_id (best-effort;
--   device_id is still client-supplied — not a substitute for real auth).
-- - Mass wipe via open DELETE policies is blocked.

create table if not exists prayer_requests (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 500),
  device_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists prayer_reactions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references prayer_requests (id) on delete cascade,
  device_id text not null,
  type text not null check (type in ('prayed', 'heart', 'amen')),
  created_at timestamptz not null default now(),
  unique (request_id, device_id, type)
);

create table if not exists prayer_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references prayer_requests (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 280),
  device_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists prayer_requests_created_at_idx
  on prayer_requests (created_at desc);

create index if not exists prayer_reactions_request_id_idx
  on prayer_reactions (request_id);

create index if not exists prayer_comments_request_id_idx
  on prayer_comments (request_id, created_at);

alter table prayer_requests enable row level security;
alter table prayer_reactions enable row level security;
alter table prayer_comments enable row level security;

grant usage on schema public to anon, authenticated;
-- No direct DELETE for anon — use RPC below.
grant select, insert on table prayer_requests to anon, authenticated;
grant select, insert on table prayer_reactions to anon, authenticated;
grant select, insert on table prayer_comments to anon, authenticated;
revoke delete on table prayer_requests from anon, authenticated;
revoke delete on table prayer_reactions from anon, authenticated;
revoke delete on table prayer_comments from anon, authenticated;

drop policy if exists "prayer_requests_select" on prayer_requests;
drop policy if exists "prayer_requests_insert" on prayer_requests;
drop policy if exists "prayer_requests_delete_own" on prayer_requests;
drop policy if exists "prayer_reactions_select" on prayer_reactions;
drop policy if exists "prayer_reactions_insert" on prayer_reactions;
drop policy if exists "prayer_reactions_delete" on prayer_reactions;
drop policy if exists "prayer_comments_select" on prayer_comments;
drop policy if exists "prayer_comments_insert" on prayer_comments;

create policy "prayer_requests_select" on prayer_requests
  for select using (true);

create policy "prayer_requests_insert" on prayer_requests
  for insert with check (true);

create policy "prayer_reactions_select" on prayer_reactions
  for select using (true);

create policy "prayer_reactions_insert" on prayer_reactions
  for insert with check (true);

create policy "prayer_comments_select" on prayer_comments
  for select using (true);

create policy "prayer_comments_insert" on prayer_comments
  for insert with check (true);

-- Owned deletes (security definer; still requires knowing device_id).
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
