-- ============================================================
-- Logbook Magang — Schema Supabase
-- Jalankan seluruh file ini di SQL Editor (supabase.com dashboard).
-- File ini idempotent: aman dijalankan ulang (policy/trigger di-drop dulu).
-- Catatan: ganti seed APPROVERS di bagian bawah dengan data asli.
-- ============================================================

-- ============================================================
-- 0) HELPER: cek apakah user saat ini tim OD (admin)
-- security definer = bypass RLS, supaya policy tidak rekursif.
-- ============================================================
create or replace function public.is_od()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'od'
  );
$$;

revoke all on function public.is_od() from public;
grant execute on function public.is_od() to anon, authenticated;

-- ============================================================
-- 1) PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  university text,
  domisili text,
  posisi text,
  phone text,
  start_date text,
  end_date text,
  ktm_file_path text,
  avatar_path text,
  role text not null default 'mahasiswa' check (role in ('mahasiswa', 'od')),
  created_at timestamptz not null default now()
);

-- Kolom untuk tabel profiles yang sudah dibuat sebelum perubahan ini.
alter table public.profiles add column if not exists domisili text;
alter table public.profiles add column if not exists start_date text;
alter table public.profiles add column if not exists end_date text;

alter table public.profiles enable row level security;

-- Mahasiswa: baca/tulis profil sendiri
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- OD: bisa baca semua profil (untuk monitoring nanti)
drop policy if exists "profiles_select_od" on public.profiles;
create policy "profiles_select_od"
  on public.profiles for select
  using (public.is_od());

-- ============================================================
-- 2) APPROVERS (pembimbing / kadep / kadiv)
-- ============================================================
create table if not exists public.approvers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null check (role in ('pembimbing', 'kadep', 'kadiv')),
  created_at timestamptz not null default now()
);

alter table public.approvers enable row level security;

-- Semua user login bisa membaca (dipakai dropdown di form)
drop policy if exists "approvers_select_all" on public.approvers;
create policy "approvers_select_all"
  on public.approvers for select
  to authenticated
  using (true);

-- (Penulisan approvers diatur manual via SQL/dashboard admin nanti.)

-- ============================================================
-- 3) LOGBOOK_SUBMISSIONS
-- ============================================================
create table if not exists public.logbook_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logbook_file_path text not null,
  -- Relasi ke approvers (id-nya), plus snapshot nama+email di bawah
  pembimbing_id uuid references public.approvers (id) on delete set null,
  kadep_id uuid references public.approvers (id) on delete set null,
  kadiv_id uuid references public.approvers (id) on delete set null,
  pembimbing_name text,
  pembimbing_email text,
  kadep_name text,
  kadep_email text,
  kadiv_name text,
  kadiv_email text,
  status text not null default 'submitted' check (
    status in (
      'submitted',
      'pembimbing_approved',
      'kadep_approved',
      'kadiv_approved',
      'rejected'
    )
  ),
  rejection_reason text,
  payment_status text check (payment_status in ('paid', 'unpaid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.logbook_submissions enable row level security;

-- Mahasiswa: baca/insert submission milik sendiri
drop policy if exists "submissions_select_own" on public.logbook_submissions;
create policy "submissions_select_own"
  on public.logbook_submissions for select
  using (auth.uid() = user_id);

drop policy if exists "submissions_insert_own" on public.logbook_submissions;
create policy "submissions_insert_own"
  on public.logbook_submissions for insert
  with check (auth.uid() = user_id);

-- OD: bisa baca semua submission (untuk monitoring nanti)
drop policy if exists "submissions_select_od" on public.logbook_submissions;
create policy "submissions_select_od"
  on public.logbook_submissions for select
  using (public.is_od());

-- Auto-update updated_at saat ada perubahan status (mis. dari Power Automate)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.logbook_submissions;
create trigger set_updated_at
  before update on public.logbook_submissions
  for each row execute function public.set_updated_at();

-- Kolom periode / kehadiran / e-sign (ditambahkan kemudian).
alter table public.logbook_submissions add column if not exists period_year int;
alter table public.logbook_submissions add column if not exists period_month int;
alter table public.logbook_submissions add column if not exists hadir_count int;
alter table public.logbook_submissions add column if not exists cuti_count int;
alter table public.logbook_submissions add column if not exists cuti_reason text;
alter table public.logbook_submissions add column if not exists signed_file_path text;

-- Index untuk query history & dashboard per-user (filter user_id + sort created_at).
create index if not exists logbook_submissions_user_id_created_at_idx
  on public.logbook_submissions (user_id, created_at);

-- ============================================================
-- 3b) HOLIDAYS — hari libur nasional + cuti bersama (SKB)
-- Di-seed otomatis oleh lib/holidays.ts dari Google Calendar publik Indonesia.
-- type 'cuti_bersama' bisa di-toggle is_libur=false bila perusahaan mewajibkan masuk.
-- ============================================================
create table if not exists public.holidays (
  date     text primary key, -- YYYY-MM-DD
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

-- ============================================================
-- 4) STORAGE BUCKETS (private) + policy
-- ============================================================
insert into storage.buckets (id, name, public)
values ('logbooks', 'logbooks', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('ktm', 'ktm', false)
on conflict (id) do nothing;

-- Bucket avatars: PUBLIC (foto profil butuh URL statis untuk tampil di sidebar).
-- Foto profil bukan data sensitif, jadi wajar ter-expose sebagai avatar publik.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Setiap file disimpan di folder {uid}/... supaya RLS ini berfungsi.

-- Bucket logbooks: user upload & baca file folder sendiri
drop policy if exists "logbooks_upload_own" on storage.objects;
create policy "logbooks_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logbooks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "logbooks_read_own" on storage.objects;
create policy "logbooks_read_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'logbooks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Bucket ktm: user upload & baca file folder sendiri
drop policy if exists "ktm_upload_own" on storage.objects;
create policy "ktm_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ktm'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ktm_read_own" on storage.objects;
create policy "ktm_read_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'ktm'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- OD: bisa baca SEMUA file di kedua bucket (untuk monitoring nanti)
drop policy if exists "logbooks_read_od" on storage.objects;
create policy "logbooks_read_od"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'logbooks'
    and public.is_od()
  );

drop policy if exists "ktm_read_od" on storage.objects;
create policy "ktm_read_od"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'ktm'
    and public.is_od()
  );

-- Bucket avatars: user upload / update / hapus file di folder sendiri
-- (bucket public → SELECT otomatis terbuka lewat public URL, tanpa policy khusus)
drop policy if exists "avatars_upload_own" on storage.objects;
create policy "avatars_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 5) SEED APPROVERS (PLACEHOLDER — ganti dengan nama & email asli!)
-- ============================================================
insert into public.approvers (name, email, role) values
  ('Budi Santoso',   'budi.santoso@perusahaan.com',   'pembimbing'),
  ('Siti Rahayu',    'siti.rahayu@perusahaan.com',    'pembimbing'),
  ('Andi Pratama',   'andi.pratama@perusahaan.com',   'pembimbing'),
  ('Dewi Lestari',   'dewi.lestari@perusahaan.com',   'kadep'),
  ('Rizky Ananda',   'rizky.ananda@perusahaan.com',   'kadep'),
  ('Maya Putri',     'maya.putri@perusahaan.com',     'kadep'),
  ('Agus Wijaya',    'agus.wijaya@perusahaan.com',    'kadiv'),
  ('Fajar Nugroho',  'fajar.nugroho@perusahaan.com',  'kadiv'),
  ('Nina Marlina',   'nina.marlina@perusahaan.com',   'kadiv')
on conflict do nothing;
