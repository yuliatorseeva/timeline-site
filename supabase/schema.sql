create extension if not exists pgcrypto;

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  birth_year integer not null,
  death_year integer,
  birth_date text not null,
  death_date text not null,
  summary text not null,
  achievements jsonb not null default '[]'::jsonb,
  wiki_title text,
  photo_url text,
  is_living boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.people
add column if not exists photo_url text;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_people_updated_at on public.people;
create trigger trg_people_updated_at
before update on public.people
for each row
execute function public.set_updated_at();

alter table public.people enable row level security;

drop policy if exists "Public read people" on public.people;
create policy "Public read people"
on public.people
for select
using (true);

drop policy if exists "Admin insert people" on public.people;
create policy "Admin insert people"
on public.people
for insert
with check (
  exists (
    select 1
    from public.admin_users admins
    where admins.user_id = auth.uid()
  )
);

drop policy if exists "Admin update people" on public.people;
create policy "Admin update people"
on public.people
for update
using (
  exists (
    select 1
    from public.admin_users admins
    where admins.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admin_users admins
    where admins.user_id = auth.uid()
  )
);

drop policy if exists "Admin delete people" on public.people;
create policy "Admin delete people"
on public.people
for delete
using (
  exists (
    select 1
    from public.admin_users admins
    where admins.user_id = auth.uid()
  )
);

-- After creating an auth user in Supabase, grant admin rights:
-- insert into public.admin_users (user_id) values ('YOUR_AUTH_USER_UUID');
