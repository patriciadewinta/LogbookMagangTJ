-- ============================================================
-- Add app_settings — konfigurasi global (gaji anak magang / hari)
-- Run this in Supabase SQL Editor (idempotent).
-- ============================================================

create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  salary_per_day int not null default 100000,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, salary_per_day)
values (1, 100000)
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

-- Hanya OD yang bisa baca/tulis pengaturan ini.
drop policy if exists "app_settings_select_od" on public.app_settings;
create policy "app_settings_select_od"
  on public.app_settings for select
  to authenticated
  using (public.is_od());

drop policy if exists "app_settings_update_od" on public.app_settings;
create policy "app_settings_update_od"
  on public.app_settings for update
  to authenticated
  using (public.is_od())
  with check (public.is_od());
