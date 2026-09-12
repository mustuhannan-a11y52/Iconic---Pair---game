-- Run this once in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)

create table if not exists kv_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Allow the app's public anon key to read and write.
-- This app has no user accounts — anyone with a game link can read/write
-- game data, which matches how it worked in the Claude-artifact version.
-- If that's ever a concern, this is the policy to tighten later.
alter table kv_store enable row level security;

create policy "public read" on kv_store
  for select using (true);

create policy "public write" on kv_store
  for insert with check (true);

create policy "public update" on kv_store
  for update using (true);
