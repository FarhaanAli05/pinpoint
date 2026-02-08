-- Property listings from external sources (Kijiji, etc.) — stored as JSON for flexibility.
-- Used by /api/listings and /listings/map. Run seed-kijiji-listings.sql to populate.

create table if not exists public.property_listings (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now()
);

alter table public.property_listings enable row level security;

-- Anyone can read (same as roommate_listings)
create policy "Anyone can read property listings"
  on public.property_listings for select
  using (true);

-- Only service role can insert/update/delete (run seed via SQL editor or backend)
-- No insert policy for auth users — seed data is inserted via SQL or service role

comment on table public.property_listings is 'Scraped/external property listings (Kijiji etc) for map. Data stored as JSON.';
