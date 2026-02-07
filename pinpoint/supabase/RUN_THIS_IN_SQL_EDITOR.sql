-- =============================================================================
-- Run this entire file in Supabase Dashboard → SQL Editor → New query
-- Then click "Run". Creates: public.profiles, public.user_preferences, public.roommate_listings.
-- =============================================================================

-- 1. Profiles (required for onboarding / "Could not find table public.profiles")
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  onboarded_at timestamptz,
  where_looking text,
  from_when date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'email', new.email),
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. User preferences (for rent/lease/sublet, location, move-in, etc.)
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  preferred_types text[] not null default '{}',
  location_estimate text,
  location_lat numeric,
  location_lng numeric,
  move_in_from date not null,
  move_in_to date,
  max_rent_cents int,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

alter table public.user_preferences enable row level security;

drop policy if exists "Users can read own preferences" on public.user_preferences;
drop policy if exists "Users can insert own preferences" on public.user_preferences;
drop policy if exists "Users can update own preferences" on public.user_preferences;
drop policy if exists "Users can delete own preferences" on public.user_preferences;
create policy "Users can read own preferences" on public.user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own preferences" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own preferences" on public.user_preferences for update using (auth.uid() = user_id);
create policy "Users can delete own preferences" on public.user_preferences for delete using (auth.uid() = user_id);

-- 3. Roommate listings (three types: looking for room+roommate, have room need people, sublet room)
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
create policy "Users can read all roommate listings" on public.roommate_listings for select using (true);
create policy "Users can insert own roommate listing" on public.roommate_listings for insert with check (auth.uid() = user_id);
create policy "Users can update own roommate listing" on public.roommate_listings for update using (auth.uid() = user_id);
create policy "Users can delete own roommate listing" on public.roommate_listings for delete using (auth.uid() = user_id);

-- 4. Pinned "me" location on map (double-click to add yourself; one per user)
alter table public.profiles
  add column if not exists pinned_lat numeric,
  add column if not exists pinned_lng numeric,
  add column if not exists pinned_at timestamptz,
  add column if not exists pinned_type text check (pinned_type in ('need-room', 'need-roommates')),
  add column if not exists pinned_note text;

-- 5. Roommate listings: how many people (optional)
alter table public.roommate_listings
  add column if not exists people_count int check (people_count is null or (people_count >= 1 and people_count <= 20));

-- 6. Roommate listings: origin (user vs seed for AI comparison)
alter table public.roommate_listings
  add column if not exists source text not null default 'user' check (source in ('user', 'seed'));

-- 7. Person profiles: name, preferences, location, budget (for people + seed data for AI)
create table if not exists public.person_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  contact_email text,
  budget_label text,
  budget_min_cents int,
  budget_max_cents int,
  move_in text,
  move_in_from date,
  preferences text[] not null default '{}',
  location_label text,
  location_lat numeric,
  location_lng numeric,
  note text,
  listing_type text,
  source text not null default 'user' check (source in ('user', 'seed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.person_profiles enable row level security;
drop policy if exists "Anyone can read person_profiles" on public.person_profiles;
drop policy if exists "Users can insert own person_profile" on public.person_profiles;
drop policy if exists "Users can update own person_profile" on public.person_profiles;
drop policy if exists "Users can delete own person_profile" on public.person_profiles;
create policy "Anyone can read person_profiles" on public.person_profiles for select using (true);
create policy "Users can insert own person_profile" on public.person_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own person_profile" on public.person_profiles for update using (auth.uid() = user_id);
create policy "Users can delete own person_profile" on public.person_profiles for delete using (auth.uid() = user_id);
