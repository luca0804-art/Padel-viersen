-- Run this in Supabase SQL editor (new project).
-- Tables: profiles, match_offers, match_participants
-- Notes:
-- - profiles.id = auth.users.id
-- - Simple open match-board. Add results/chat later.

-- Geo support (for "Viersen & Umgebung" radius search)
create extension if not exists postgis;

create table if not exists public.profiles (
  id uuid primary key,
  email text,
  display_name text,
  city text not null default 'Viersen',
  home_location geography(point, 4326),
  search_radius_km integer not null default 25,
  rating_elo integer not null default 1000,
  matches_played integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.match_offers (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  format text not null check (format in ('2v2','1v1')),
  time_start timestamptz not null,
  time_end timestamptz not null,
  city text not null default 'Viersen',
  location_text text not null,
  location geography(point, 4326),
  level_min integer not null default 0,
  level_max integer not null default 9999,
  status text not null default 'open' check (status in ('open','cancelled','completed')),
  created_at timestamptz not null default now()
);

-- Helper RPC to fetch offers within a radius (km)
create or replace function public.nearby_match_offers(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision
)
returns table (
  id uuid,
  creator_id uuid,
  format text,
  time_start timestamptz,
  time_end timestamptz,
  city text,
  location_text text,
  level_min integer,
  level_max integer,
  status text,
  created_at timestamptz,
  creator_display_name text,
  creator_rating_elo integer,
  lat double precision,
  lng double precision
)
language sql
stable
as $$
  select
    mo.id,
    mo.creator_id,
    mo.format,
    mo.time_start,
    mo.time_end,
    mo.city,
    mo.location_text,
    mo.level_min,
    mo.level_max,
    mo.status,
    mo.created_at,
    p.display_name as creator_display_name,
    p.rating_elo as creator_rating_elo,
    st_y(mo.location::geometry) as lat,
    st_x(mo.location::geometry) as lng
  from public.match_offers mo
  left join public.profiles p on p.id = mo.creator_id
  where mo.status = 'open'
    and mo.location is not null
    and st_dwithin(
      mo.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
  order by mo.time_start asc;
$$;

create table if not exists public.match_participants (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.match_offers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (offer_id, user_id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.match_offers enable row level security;
alter table public.match_participants enable row level security;

-- Policies
-- Profiles: everyone can read; only owner can upsert their own row
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all"
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists "profiles_upsert_self" on public.profiles;
create policy "profiles_upsert_self"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Match offers: everyone can read open offers; creator can insert/update their own offers
drop policy if exists "offers_read_all" on public.match_offers;
create policy "offers_read_all"
on public.match_offers for select
to anon, authenticated
using (true);

drop policy if exists "offers_insert_creator" on public.match_offers;
create policy "offers_insert_creator"
on public.match_offers for insert
to authenticated
with check (auth.uid() = creator_id);

drop policy if exists "offers_update_creator" on public.match_offers;
create policy "offers_update_creator"
on public.match_offers for update
to authenticated
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

-- Participants: everyone can read; users can join/leave themselves
drop policy if exists "participants_read_all" on public.match_participants;
create policy "participants_read_all"
on public.match_participants for select
to anon, authenticated
using (true);

drop policy if exists "participants_insert_self" on public.match_participants;
create policy "participants_insert_self"
on public.match_participants for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "participants_delete_self" on public.match_participants;
create policy "participants_delete_self"
on public.match_participants for delete
to authenticated
using (auth.uid() = user_id);

-- Helpful index
create index if not exists idx_match_offers_time_start on public.match_offers(time_start);
