-- Enable pgcrypto for hashing if not already
create extension if not exists pgcrypto with schema public;

-- Create API keys table
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  device_id text not null,
  name text,
  key_prefix text not null,
  key_hash text not null,
  enabled boolean not null default true,
  rate_limit_per_minute integer not null default 30,
  total_calls bigint not null default 0,
  last_used_at timestamptz
);

-- Indexes
create index if not exists idx_api_keys_device on public.api_keys (device_id);
create index if not exists idx_api_keys_key_hash on public.api_keys (key_hash);

-- RLS
alter table public.api_keys enable row level security;

-- Device-managed access via x-device-id
create policy "Device can select own api keys"
  on public.api_keys
  for select
  using (device_id = coalesce(public.request_header('x-device-id'), ''));

create policy "Device can insert own api keys"
  on public.api_keys
  for insert
  with check (device_id = coalesce(public.request_header('x-device-id'), ''));

create policy "Device can update own api keys"
  on public.api_keys
  for update
  using (device_id = coalesce(public.request_header('x-device-id'), ''))
  with check (device_id = coalesce(public.request_header('x-device-id'), ''));

create policy "Device can delete own api keys"
  on public.api_keys
  for delete
  using (device_id = coalesce(public.request_header('x-device-id'), ''));

-- Allow validation by key passed in x-api-key header (without exposing rows)
create policy "API client can validate using x-api-key"
  on public.api_keys
  for select
  using (
    enabled = true
    and coalesce(public.request_header('x-api-key'), '') <> ''
    and encode(digest(coalesce(public.request_header('x-api-key'), ''), 'sha256'), 'hex') = key_hash
  );