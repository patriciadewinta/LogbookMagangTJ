-- ============================================================
-- Add intern profile fields (email denormalized + token fields)
-- Run this in Supabase SQL Editor (idempotent).
-- ============================================================

-- profiles: denormalized email (for read-only display in OD edit modal)
alter table public.profiles add column if not exists email text;

-- password_set_tokens: full intern data carried from OD "Input List" form
-- into the set-password flow, then written to the profile.
alter table public.password_set_tokens add column if not exists posisi text;
alter table public.password_set_tokens add column if not exists domisili text;
alter table public.password_set_tokens add column if not exists start_date text;
alter table public.password_set_tokens add column if not exists end_date text;
alter table public.password_set_tokens add column if not exists phone text;
