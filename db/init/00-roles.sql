-- Roles + schemas + extensions for the Supabase-compatible local stack.
-- IMPORTANT: do NOT pre-create auth.uid(), auth.role(), or auth.users here —
-- GoTrue's first-run migrations create those, and ownership conflicts will
-- cause GoTrue to fatally fail. We just stand up the schemas and roles.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator login password 'postgres' noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    create role supabase_auth_admin login password 'postgres' createrole;
  end if;
end $$;

grant anon, authenticated, service_role to authenticator;

-- The auth schema is owned by supabase_auth_admin so GoTrue can run its migrations.
create schema if not exists auth authorization supabase_auth_admin;
grant usage on schema auth to anon, authenticated, service_role;
alter default privileges in schema auth grant all on tables to service_role;

-- Pre-create auth.uid() / auth.role() owned by supabase_auth_admin so:
--   1. our public.* RLS policies referencing auth.uid() resolve at init time, and
--   2. GoTrue's CREATE OR REPLACE FUNCTION auth.uid() can succeed (same owner).
set role supabase_auth_admin;
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
create or replace function auth.role() returns text
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.role', true), '')::text;
$$;
reset role;

-- Extensions.
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Public schema permissions for PostgREST.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to authenticated, service_role;
alter default privileges in schema public grant all on sequences to authenticated, service_role;

-- Stub auth.users so the public.* foreign keys can resolve at init time.
-- GoTrue's migrations use CREATE TABLE IF NOT EXISTS, so this is safe.
-- We deliberately match the columns GoTrue's first migration creates (no extras),
-- so the migration is a no-op when it runs.
create table if not exists auth.users (
  instance_id uuid null,
  id uuid not null unique,
  aud varchar(255) null,
  "role" varchar(255) null,
  email varchar(255) null unique,
  encrypted_password varchar(255) null,
  confirmed_at timestamptz null,
  invited_at timestamptz null,
  confirmation_token varchar(255) null,
  confirmation_sent_at timestamptz null,
  recovery_token varchar(255) null,
  recovery_sent_at timestamptz null,
  email_change_token varchar(255) null,
  email_change varchar(255) null,
  email_change_sent_at timestamptz null,
  last_sign_in_at timestamptz null,
  raw_app_meta_data jsonb null,
  raw_user_meta_data jsonb null,
  is_super_admin bool null,
  created_at timestamptz null,
  updated_at timestamptz null,
  constraint users_pkey primary key (id)
);

alter table auth.users owner to supabase_auth_admin;
grant all on auth.users to service_role, supabase_auth_admin;
grant select on auth.users to authenticated;
