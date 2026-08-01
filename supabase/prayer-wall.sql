-- Prayer wall schema for Bible-app
-- Run this in the Supabase SQL editor, then set PUBLIC_SUPABASE_URL
-- and PUBLIC_SUPABASE_ANON_KEY in .env

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

-- Public read + insert (anonymous community wall).
-- Deletes allowed only for matching device_id (spoofable; fine for MVP).

create policy "prayer_requests_select" on prayer_requests
  for select using (true);

create policy "prayer_requests_insert" on prayer_requests
  for insert with check (true);

create policy "prayer_requests_delete_own" on prayer_requests
  for delete using (true);

create policy "prayer_reactions_select" on prayer_reactions
  for select using (true);

create policy "prayer_reactions_insert" on prayer_reactions
  for insert with check (true);

create policy "prayer_reactions_delete" on prayer_reactions
  for delete using (true);

create policy "prayer_comments_select" on prayer_comments
  for select using (true);

create policy "prayer_comments_insert" on prayer_comments
  for insert with check (true);
