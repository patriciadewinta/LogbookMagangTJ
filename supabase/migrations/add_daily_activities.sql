-- ============================================================
-- Daily Activities Table — draft kegiatan harian anak magang.
-- Kegiatan diisi per tanggal, tersimpan sebagai draft, baru
-- dipakai saat logbook bulanan di-submit.
-- Run this in Supabase SQL Editor (idempotent).
-- ============================================================

create table if not exists public.daily_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tanggal text not null, -- YYYY-MM-DD
  kegiatan text not null,
  submission_id uuid references public.logbook_submissions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Satu user, satu kegiatan per tanggal (isi ulang = update).
create unique index if not exists daily_activities_user_id_tanggal_key
  on public.daily_activities(user_id, tanggal);

-- Cari draft yang belum masuk submission (dipakai saat submit logbook).
create index if not exists daily_activities_user_id_submission_id_idx
  on public.daily_activities(user_id, submission_id);

alter table public.daily_activities enable row level security;

-- User hanya bisa lihat dan kelola draft miliknya sendiri.
drop policy if exists "daily_activities_select_own" on public.daily_activities;
create policy "daily_activities_select_own"
  on public.daily_activities for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "daily_activities_insert_own" on public.daily_activities;
create policy "daily_activities_insert_own"
  on public.daily_activities for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "daily_activities_update_own" on public.daily_activities;
create policy "daily_activities_update_own"
  on public.daily_activities for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "daily_activities_delete_own" on public.daily_activities;
create policy "daily_activities_delete_own"
  on public.daily_activities for delete
  to authenticated
  using (auth.uid() = user_id);
