-- How many roommates the user is looking for or has room for (optional).
alter table public.roommate_listings
  add column if not exists people_count int check (people_count is null or (people_count >= 1 and people_count <= 20));

comment on column public.roommate_listings.people_count is 'Number of roommates needed or wanted (e.g. need 2 roommates, or looking for 1–2 people).';
