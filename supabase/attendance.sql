-- Perubahan inkremental untuk fitur dashboard kehadiran (menerapkan bagian dari schema.sql)
-- Kolom baru di logbook_submissions
alter table public.logbook_submissions
  add column if not exists period_year int,
  add column if not exists period_month int,
  add column if not exists hadir_count int,
  add column if not exists cuti_count int,
  add column if not exists cuti_reason text,
  add column if not exists signed_file_path text;

-- Tabel holidays
create table if not exists public.holidays (
  date     text primary key,
  name     text not null,
  type     text not null check (type in ('libur_nasional', 'cuti_bersama')),
  is_libur boolean not null default true,
  year     int not null
);

alter table public.holidays enable row level security;

drop policy if exists "holidays_select_all" on public.holidays;
create policy "holidays_select_all"
  on public.holidays for select
  to authenticated
  using (true);

drop policy if exists "holidays_update_od" on public.holidays;
create policy "holidays_update_od"
  on public.holidays for update
  using (public.is_od());
