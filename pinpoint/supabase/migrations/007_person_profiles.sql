-- Person profiles: name, preferences, location, budget, etc. For real users and seed data (AI comparison).
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

create policy "Anyone can read person_profiles"
  on public.person_profiles for select using (true);

create policy "Users can insert own person_profile"
  on public.person_profiles for insert with check (auth.uid() = user_id);

create policy "Users can update own person_profile"
  on public.person_profiles for update using (auth.uid() = user_id);

create policy "Users can delete own person_profile"
  on public.person_profiles for delete using (auth.uid() = user_id);

comment on table public.person_profiles is 'People data: name, preferences, location, budget. source=seed for mock data (AI comparison).';
