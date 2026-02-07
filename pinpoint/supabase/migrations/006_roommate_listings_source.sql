-- Mark listing origin: 'user' = real user, 'seed' = mock/seed data for AI comparison.
alter table public.roommate_listings
  add column if not exists source text not null default 'user' check (source in ('user', 'seed'));

comment on column public.roommate_listings.source is 'Origin: user = added by user, seed = mock data for AI comparison.';
