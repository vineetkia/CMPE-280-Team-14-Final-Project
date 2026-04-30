-- Hyrd · Postgres schema (Supabase)
-- Run in the Supabase SQL editor.

-- Helpful extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  target_role text,
  years_exp int,
  default_voice text default 'Halden',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles read self" on public.profiles;
create policy "profiles read self" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles upsert self" on public.profiles;
create policy "profiles upsert self" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- jobs
-- ============================================================
create table if not exists public.jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  location text,
  salary_min int,
  salary_max int,
  jd_text text,
  source_url text,
  status text not null check (status in ('saved','applied','interview','offer','rejected')),
  position int not null default 0,
  notes text,
  brand_color text,
  interview_at timestamptz,
  offer_amount text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_jobs_user_status on public.jobs(user_id, status, position);

alter table public.jobs enable row level security;

drop policy if exists "jobs scope user" on public.jobs;
create policy "jobs scope user" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- resumes
-- ============================================================
create table if not exists public.resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  label text,
  original_file_path text,
  parsed_json jsonb,
  optimized_json jsonb,
  ats_score int,
  keyword_coverage int,
  is_active boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_resumes_user on public.resumes(user_id);
create index if not exists idx_resumes_job on public.resumes(job_id);

alter table public.resumes enable row level security;

drop policy if exists "resumes scope user" on public.resumes;
create policy "resumes scope user" on public.resumes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- interviews
-- ============================================================
create table if not exists public.interviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  livekit_room text,
  voice text,
  style text,
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','completed','failed')),
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int,
  created_at timestamptz default now()
);

create index if not exists idx_interviews_user on public.interviews(user_id);

alter table public.interviews enable row level security;

drop policy if exists "interviews scope user" on public.interviews;
create policy "interviews scope user" on public.interviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- interview_results
-- ============================================================
create table if not exists public.interview_results (
  interview_id uuid primary key references public.interviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  overall_score int,
  dimensions jsonb,
  question_scores jsonb,
  filler_count int,
  wpm int,
  improvement_plan jsonb,
  transcript jsonb,
  created_at timestamptz default now()
);

alter table public.interview_results enable row level security;

drop policy if exists "interview_results scope user" on public.interview_results;
create policy "interview_results scope user" on public.interview_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_jobs_touch on public.jobs;
create trigger trg_jobs_touch before update on public.jobs
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Storage bucket policy (manual: create bucket "resumes" in dashboard)
-- ============================================================
-- After creating the bucket, run:
-- insert into storage.buckets (id, name, public) values ('resumes','resumes', false)
--   on conflict do nothing;
