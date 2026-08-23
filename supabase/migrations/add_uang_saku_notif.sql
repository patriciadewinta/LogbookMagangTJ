-- ============================================================
-- Add uang saku nominal + email notification preference
-- Run this in Supabase SQL Editor (idempotent).
-- ============================================================

-- profiles: persist "Notifikasi Email" toggle from intern Settings
alter table public.profiles add column if not exists email_notif boolean not null default true;

-- logbook_submissions: nominal uang saku paid per submission (Rupiah)
alter table public.logbook_submissions add column if not exists payment_amount int;
