-- GearLab first-time Supabase setup.
-- Run this ONCE in Supabase -> SQL Editor -> New query -> Run.
--
-- IMPORTANT:
-- These policies are intentionally simple for a personal/private prototype.
-- Before sharing GearLab publicly, add Supabase Auth and tighten RLS policies.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  description text,
  image_url text,
  source_url text not null,
  price text,
  rating numeric(3,1),
  model_url text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "gearlab products read" on public.products;
create policy "gearlab products read"
on public.products for select
to anon, authenticated
using (true);

drop policy if exists "gearlab products insert" on public.products;
create policy "gearlab products insert"
on public.products for insert
to anon, authenticated
with check (true);

drop policy if exists "gearlab products delete" on public.products;
create policy "gearlab products delete"
on public.products for delete
to anon, authenticated
using (true);

insert into storage.buckets (id, name, public, file_size_limit)
values ('gearlab-assets', 'gearlab-assets', true, 15728640)
on conflict (id) do update set public = true, file_size_limit = 15728640;

drop policy if exists "gearlab assets read" on storage.objects;
create policy "gearlab assets read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'gearlab-assets');

drop policy if exists "gearlab assets insert" on storage.objects;
create policy "gearlab assets insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'gearlab-assets');
