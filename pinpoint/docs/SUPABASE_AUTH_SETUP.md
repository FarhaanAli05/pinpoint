# Supabase Auth Setup for Pinpoint

## 1. Credentials you need from Supabase

Get these from your Supabase project: **Project Settings → API** (and **Authentication** for provider config).

| Variable | Where to find | Purpose |
|----------|----------------|--------|
| **`NEXT_PUBLIC_SUPABASE_URL`** | Project Settings → API → **Project URL** | Client-side: connect to your project |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | Project Settings → API → **anon public** key | Client-side: sign in/out, read public data (RLS applies) |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Project Settings → API → **service_role** key | Server-only: bypass RLS for admin tasks (never expose in client) |

For **Google sign-in** (optional), you also configure in Supabase:

- **Authentication → Providers → Google**: enable and add your **Google Client ID** and **Google Client Secret** (from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)).

---

## Redirect URLs (required for OAuth / magic links)

Supabase must know which URLs are allowed to receive the user after sign-in.

### 1. In Supabase Dashboard

Go to **Authentication → URL Configuration**:

| Setting | Example (dev) | Example (prod) |
|--------|----------------|-----------------|
| **Site URL** | `http://localhost:3000` | `https://yourdomain.com` |
| **Redirect URLs** | Add: `http://localhost:3000/auth/callback` | Add: `https://yourdomain.com/auth/callback` |

- **Site URL** = default redirect after sign-in when no `redirectTo` is given.
- **Redirect URLs** = allowlist; only these URLs can be used as `redirectTo`. Add one per environment (localhost, staging, production).

### 2. Optional: in `.env` (for building redirect in code)

If you need a single base URL (e.g. for server-side or email links), add:

```env
# Base URL of your app (used to build auth redirect/callback URL)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then in code you can use `redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback``. In the browser you can also use `window.location.origin + '/auth/callback'` so this env var is optional.

### 3. In your app

- **Auth callback route**: `app/auth/callback/route.ts` is set up. It receives `?code=...` (and optional `?next=/listings`), exchanges the code for a session, sets the session cookie, then redirects to `next` or `/onboard`.
- When calling **signInWithOAuth**, pass `redirectTo: '<your-site>/auth/callback'` (e.g. `http://localhost:3000/auth/callback` in dev) so Supabase sends the user there after the provider (Google) approves.

**Redirect checklist:**

1. **Supabase Dashboard** → Authentication → URL Configuration: set **Site URL** and add **Redirect URLs** (e.g. `http://localhost:3000/auth/callback`).
2. **Optional** `.env`: `NEXT_PUBLIC_APP_URL=http://localhost:3000` so the callback can redirect to the right origin (otherwise it uses the request origin).
3. **Sign-in page**: when calling `signInWithOAuth`, use `redirectTo: \`${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback\`` (and optionally `?next=/onboard` in the URL).

---

Add to **`.env.local`** (and keep `.env.local` out of git):

```env
# Supabase (required for auth)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Google OAuth (if using Google sign-in via Supabase)
# Create OAuth client at https://console.cloud.google.com/apis/credentials
# Add redirect URI: https://<project-ref>.supabase.co/auth/v1/callback
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 2. Intro path (sign in → onboard → app)

Flow:

1. **Landing** → `/`
2. **Sign in** → `/auth/signin` (Supabase sign in; redirect back with session)
3. **Intro / onboarding** → `/onboard` (where, from when; only if not already onboarded)
4. **App** → `/listings` (and `/listings/map`, `/roommates`, etc.)

Redirect logic:

- Not signed in and hitting a protected route → redirect to `/auth/signin?callbackUrl=<current path>`.
- Signed in, first time → redirect to `/onboard`.
- Signed in, already onboarded → redirect to `/listings`.

“Already onboarded” can be stored in Supabase (e.g. `profiles.onboarded_at`) or in a cookie/localStorage until you move it to the DB.

---

## 3. OAuth vs app tables

**Supabase Auth (automatic):** When you enable Auth (e.g. Google OAuth), Supabase creates **`auth.users`**, **`auth.sessions`**, etc. You do **not** create these.

**Your app tables (you create):** Create **`public.profiles`** and **`public.user_preferences`** in the SQL Editor (see migrations in `supabase/migrations/` or the sections below) for onboarding and preferences (rent/lease/sublet, location, move-in) so you can compare users.

---

## 4. Table code (sign in / sign out + intro)

Supabase **Auth** already has built-in tables (`auth.users`, `auth.sessions`, etc.). You don’t need extra tables just for sign in/sign out.

For the **intro path** (e.g. “has the user completed onboarding?”), add one table that ties to the signed-in user.

Run this in the Supabase **SQL Editor** (one-time):

```sql
-- Optional: enable UUID extension if not already
-- create extension if not exists "uuid-ossp";

-- Profile / intro state for each user (links to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  -- Intro / onboarding
  onboarded_at timestamptz,
  where_looking text,
  from_when date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: users can read/update only their own row
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger: create profile on first sign up (optional)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.raw_user_meta_data->>'email',
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Summary:

- **Sign in / sign out**: use Supabase Auth only; no extra tables required.
- **Intro path**: use `public.profiles` to store `onboarded_at`, `where_looking`, `from_when` and drive redirects (e.g. show `/onboard` only when `onboarded_at` is null).

---

## 5. User preferences table (for matching)

Run this **after** the profiles migration so you can store what users want (rent/lease/sublet), location estimate, move-in window, and optional max rent/notes. Used to compare users and match with listings.

```sql
-- User preferences: rent/lease/sublet, location, move-in, optional fields
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  preferred_types text[] not null default '{}',  -- 'rent', 'lease', 'sublet'
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
create policy "Users can read own preferences" on public.user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own preferences" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own preferences" on public.user_preferences for update using (auth.uid() = user_id);
create policy "Users can delete own preferences" on public.user_preferences for delete using (auth.uid() = user_id);
```

---

## 6. Minimal table (sign in / sign out only)

If you **don’t** need to store onboarding in the DB yet, you can skip `profiles` and use only Supabase Auth:

- **Sign in**: `supabase.auth.signInWithPassword()` or `signInWithOAuth({ provider: 'google' })`.
- **Sign out**: `supabase.auth.signOut()`.
- **Session**: `supabase.auth.getSession()` / `onAuthStateChange()`.

No custom tables needed for that. Add the `profiles` table above when you want to persist the intro/onboarding state in Supabase.
