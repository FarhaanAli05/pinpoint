-- Roommate listings: three types (looking for room+roommate, have room need people, sublet room).
-- Run after 001 and 002. Links to auth.users.

do $$ begin
  create type public.roommate_listing_type as enum (
    'looking_for_room_and_roommate',
    'have_room_need_roommates',
    'sublet_room'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.roommate_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  listing_type public.roommate_listing_type not null,
  title text not null,
  description text,
  address text,
  area_label text,
  lat numeric,
  lng numeric,
  move_in_from date,
  move_in_to date,
  rent_cents int,
  contact_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.roommate_listings enable row level security;

drop policy if exists "Users can read all roommate listings" on public.roommate_listings;
drop policy if exists "Users can insert own roommate listing" on public.roommate_listings;
drop policy if exists "Users can update own roommate listing" on public.roommate_listings;
drop policy if exists "Users can delete own roommate listing" on public.roommate_listings;
create policy "Users can read all roommate listings"
  on public.roommate_listings for select
  using (true);

create policy "Users can insert own roommate listing"
  on public.roommate_listings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own roommate listing"
  on public.roommate_listings for update
  using (auth.uid() = user_id);

create policy "Users can delete own roommate listing"
  on public.roommate_listings for delete
  using (auth.uid() = user_id);

comment on table public.roommate_listings is 'Roommate map pins: looking for room+roommate, have room need people, or subletting a room.';
