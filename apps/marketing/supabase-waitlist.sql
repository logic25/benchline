-- Benchline marketing — waitlist table
-- Run this in the SAME Supabase project as the main app (recommended) or a
-- dedicated marketing project. The marketing server writes with the SERVICE
-- ROLE key, so RLS does not need an INSERT policy for the form to work; RLS is
-- still enabled to block any anon/public access.

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  role        text not null check (role in ('litigator', 'per-diem', 'both')),
  bar_number  text,
  firm_name   text,
  city        text,
  created_at  timestamptz not null default now(),
  unique (email)
);

alter table public.waitlist enable row level security;

-- No anon policies: only the service role (used server-side) can read/insert.
-- (Service role bypasses RLS.) Add an admin-read policy later if desired.

create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);
