-- App feedback (optional). Run in Supabase SQL editor if you want shared feedback.
-- Works with the same PUBLIC_SUPABASE_* keys as the prayer wall.
--
-- Anon can INSERT only. Read feedback in the Supabase Table Editor (service role),
-- not via the public anon key.

create table if not exists app_feedback (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 1000),
  device_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists app_feedback_created_at_idx
  on app_feedback (created_at desc);

alter table app_feedback enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table app_feedback to anon, authenticated;
revoke select on table app_feedback from anon, authenticated;

drop policy if exists "app_feedback_select" on app_feedback;
drop policy if exists "app_feedback_insert" on app_feedback;

create policy "app_feedback_insert" on app_feedback
  for insert with check (true);
