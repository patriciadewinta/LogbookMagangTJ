-- ============================================================
-- Password Set Tokens Table
-- Stores temporary tokens for intern password setup links
-- Run this in Supabase SQL Editor
-- ============================================================

create table if not exists public.password_set_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null,
  name text,
  university text,
  posisi text,
  domisili text,
  start_date text,
  end_date text,
  phone text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index for faster token lookup
create index if not exists password_set_tokens_token_idx
  on public.password_set_tokens(token);

-- Enable RLS (optional - token lookup can be public)
alter table public.password_set_tokens enable row level security;

-- Allow unauthenticated access for token validation (needed for password setup page)
drop policy if exists "password_set_tokens_select_all" on public.password_set_tokens;
create policy "password_set_tokens_select_all"
  on public.password_set_tokens for select
  to anon, authenticated
  using (true);

-- Only OD can insert tokens
drop policy if exists "password_set_tokens_insert_od" on public.password_set_tokens;
create policy "password_set_tokens_insert_od"
  on public.password_set_tokens for insert
  to authenticated
  with check (public.is_od());
