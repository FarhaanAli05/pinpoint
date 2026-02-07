# Pinpoint — User Flow & System Design (Prompt for Visualizer)

Copy the sections below into your system design / flow software. Replace [ICON: name] with your tool’s icon syntax or pick from the suggested icons.

---

## 1. ACTORS

- **User** [ICON: person / user]
- **Pinpoint App (Frontend)** [ICON: browser / app / monitor]
- **RentCast API** [ICON: cloud / API / plug]
- **Local storage** [ICON: database / storage / disk] (user pins, theme)

---

## 2. ENTRY POINTS

- **Landing (/)**
  - Hero: “Housing on the map”
  - CTAs: **Find a room** [ICON: home / bed], **Find roommates** [ICON: users / people], **Full onboarding**
- **Open App** → Start onboarding (/start)

---

## 3. USER FLOWS (step-by-step)

### Flow A: Find a room

1. User lands on **Home** [ICON: home].
2. Clicks **Find a room** [ICON: home / search].
3. **Find room** wizard (/find-room):
   - Step 1: **Area** (Near campus / Downtown / West end) [ICON: map-pin / location].
   - Step 2: **Budget** (Under $600 … $1000+) [ICON: dollar / wallet].
   - Step 3: **Move-in** (May 2025, Sept 2025, ASAP, …) [ICON: calendar].
   - Step 4: **Type** (Room vs Whole unit) [ICON: layout / layers].
   - Step 5: **Preferences** (Quiet, Pet-free, Smoking-free) [ICON: checklist].
4. Optional: checks **“Also find roommates”** [ICON: users].
5. Clicks **Show my listings** → redirected to **Map** [ICON: map].
6. Map shows **Listings** view: pins from Seed + User pins + **RentCast API** [ICON: cloud]. List filtered by area, budget, type, prefs.
7. If “Also find roommates” was checked: **Roommates** view opens with **AI match** panel [ICON: sparkles / bot].
8. User clicks a **listing pin** [ICON: map-pin / home] → **Listing detail panel** (rent, move-in, email contact).
9. User can **double-click map** to **add own pin** (need room / need roommates) [ICON: plus / pin].

### Flow B: Find roommates

1. User on **Home** or **Dashboard**.
2. Clicks **Find roommates** [ICON: users].
3. **Dashboard Find** (/dashboard/find): one question — **“What do you need?”** (e.g. looking for room, have sublet, need roommates, searching with mates) [ICON: message / form].
4. Chooses one → redirected to **Map** with **Roommates** view and **AI match** panel open.
5. Map shows only **people pins** (looking for roommates) [ICON: person].
6. **Students like you** panel lists hardcoded matches; user clicks one → **Profile detail panel** (budget, move-in, email) [ICON: user-card].
7. Contact via **email** only [ICON: mail] (no in-app accounts).

### Flow C: Full onboarding (Start)

1. User clicks **Open App** or **Full onboarding** → **Start** (/start).
2. Chat-style steps: **Need** → **Location** → **Budget** → **Move-in** → **Preferences** [ICON: chat / list].
3. **Show my results** → Map with optional zoom to area; **AI match** panel can open.
4. Same Map experience as Flow A/B (Listings vs Roommates toggle).

### Flow D: Map as hub (toggle)

- **Map** page has a **toggle** [ICON: toggle / split]:
  - **Listings** [ICON: home / list]: sublets + share listings (from Seed, User pins, RentCast).
  - **Roommates** [ICON: users]: “Looking for roommates” pins + **AI match** panel.
- **Sidebar** [ICON: menu]: Home, Dashboard, Find room, Map, Theme (dark/light), Exit.

---

## 4. SYSTEM COMPONENTS (for system design diagram)

- **Client (Next.js App)**
  - Pages: Landing, Start, Find room, Dashboard, Dashboard Find, Map.
  - Components: MapView (Leaflet), ListingDetailPanel, StudentsLikeYouPanel, StudentProfileDetailPanel, AddUserPinModal, LeftSidebar.
  - State: React context (pins = seed + user pins), theme (localStorage), URL params (area, budget, view, etc.).
- **API route (server)**
  - `GET /api/rentcast/listings` [ICON: server / API]: reads `RENTCAST_API_KEY`, calls RentCast with city, state, minPrice, maxPrice; returns pins.
- **External**
  - **RentCast API** [ICON: cloud]: `GET .../v1/listings/rental/long-term` (listings by location/price).
- **Local**
  - **Seed data** [ICON: database]: hardcoded demo pins (sublet, share-listing, looking-for-roommates).
  - **localStorage** [ICON: storage]: user-added pins, theme preference.

---

## 5. DATA FLOW (one-line bullets for arrows)

- User → **Find room** → (area, budget, move-in, type, prefs) → **Map** (URL params).
- **Map** → `GET /api/rentcast/listings?city=&state=&minPrice=&maxPrice=` → **RentCast API** → list of listings → map pins.
- **Map** pins = **Seed pins** + **User pins (localStorage)** + **RentCast pins**.
- User double-click on map → **Add pin** (email, “need room” / “need roommates”) → **localStorage**.
- User click listing pin → **Listing detail** (email contact). User click roommate profile → **Profile detail** (email contact).

---

## 6. ICON CHEAT SHEET (for your visualizer)

Use these names if your tool has an icon library:

| Concept           | Icon suggestions        |
|------------------|--------------------------|
| User / Person    | person, user             |
| Home / Room      | home, bed                |
| Map              | map, map-pin             |
| Roommates / People | users, people, group  |
| API / External   | cloud, api, plug         |
| Database / Storage | database, storage      |
| AI / Match       | sparkles, bot, magic     |
| Email / Contact  | mail, send               |
| Form / Steps     | form, list, checklist    |
| Toggle / Split   | toggle, columns          |
| Settings / Theme | sun, moon, palette       |
| Navigation       | menu, sidebar            |

---

## 7. SHORT PROMPT (single paragraph for AI / simple tools)

**Pinpoint** is a housing/roommate app. **User** enters via **Landing** and chooses **Find a room** (multi-step: area, budget, move-in, type, prefs) or **Find roommates** (one question) or **Full onboarding** (chat-style). All paths lead to a **Map** with a **Listings** vs **Roommates** toggle. **Listings** view shows pins from **seed data**, **user-added pins** (localStorage), and **RentCast API** (server route calls external API). **Roommates** view shows people-looking-for-mates pins and an **AI match** panel. User clicks pins for **detail panels** and contacts via **email** only. **Icons:** user, home, map, users, cloud/API, database, mail, sparkles (AI).

---

Paste any section into your software, then tell me what visualization you need (e.g. flowchart, C4 diagram, sequence diagram) and I can adapt this into that format.
