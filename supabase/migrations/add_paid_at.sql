-- ============================================================
-- Add paid_at timestamp — waktu HR menandai submission dibayar
-- Run this in Supabase SQL Editor (idempotent).
-- ============================================================

alter table public.logbook_submissions add column if not exists paid_at timestamptz;

-- Backfill data yang sudah dibayar sebelum kolom ini ada (pakai updated_at).
update public.logbook_submissions
set paid_at = updated_at
where payment_status = 'paid' and paid_at is null;
