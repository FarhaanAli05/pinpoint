-- Add "my pinned location" on the map: when user double-clicks and adds themselves,
-- we store one location per user here (shown as yellow / "me" pin).
alter table public.profiles
  add column if not exists pinned_lat numeric,
  add column if not exists pinned_lng numeric,
  add column if not exists pinned_at timestamptz,
  add column if not exists pinned_type text check (pinned_type in ('need-room', 'need-roommates')),
  add column if not exists pinned_note text;

comment on column public.profiles.pinned_lat is 'User’s “me” pin on the map (set by double-click + add).';
comment on column public.profiles.pinned_type is 'need-room = looking for a room here; need-roommates = looking for roommates here.';
