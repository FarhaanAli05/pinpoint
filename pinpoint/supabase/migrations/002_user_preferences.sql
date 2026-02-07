-- User preferences for matching: what you want (rent/lease/sublet), location, move-in, optional fields.
-- Run in Supabase SQL Editor after 001_profiles_for_auth_and_intro.sql.
-- Supabase Auth creates auth.users / auth.sessions automatically; we create public tables.

-- One row per user: preferences for matching with listings and other users
-- preferred_types: allowed values 'rent', 'lease', 'sublet' (user can pick one or more)
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- What you want (multi-select: rent, lease, sublet)
  preferred_types text[] not null default '{}',
  -- Location: estimated area/city (e.g. "Kingston, ON", "Near campus")
  location_estimate text,
  -- Optional: lat/lng for map-based matching later
  location_lat numeric,
  location_lng numeric,
  -- Move-in window
  move_in_from date not null,
  move_in_to date,
  -- Optional
  max_rent_cents int,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

-- RLS: users can only read/update their own preferences
alter table public.user_preferences enable row level security;

drop policy if exists "Users can read own preferences" on public.user_preferences;
drop policy if exists "Users can insert own preferences" on public.user_preferences;
drop policy if exists "Users can update own preferences" on public.user_preferences;
drop policy if exists "Users can delete own preferences" on public.user_preferences;
create policy "Users can read own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete own preferences"
  on public.user_preferences for delete
  using (auth.uid() = user_id);

-- Keep profiles in sync: set onboarded_at when preferences are saved (optional; you can do this in app code instead)
-- Here we only define the table; the app will set profiles.onboarded_at when user completes onboarding.

comment on table public.user_preferences is 'User preferences for matching: rent/lease/sublet, location, move-in, optional max_rent and notes.';
