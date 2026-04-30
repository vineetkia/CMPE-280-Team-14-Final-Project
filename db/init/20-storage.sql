-- Local Storage shim — replaces Supabase Storage when self-hosting on a single Postgres.
-- The Next.js app's /api/storage/* routes read and write to this table.

create table if not exists public.storage_objects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null default 'resumes',
  name text not null,
  mime text,
  size_bytes int,
  data bytea not null,
  created_at timestamptz default now()
);

create index if not exists idx_storage_user on public.storage_objects(user_id);

alter table public.storage_objects enable row level security;

drop policy if exists "storage scope user" on public.storage_objects;
create policy "storage scope user" on public.storage_objects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
