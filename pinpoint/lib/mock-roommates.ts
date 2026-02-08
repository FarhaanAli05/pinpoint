/**
 * Mock roommates (people on the roommates map) — pins in Kingston, all three categories.
 * These are MOCK data only — not in the database.
 */
import type { Pin, ListingCategory } from "./types";

/**
 * Real Kingston, ON locations (lat, lng) — residential/urban areas only.
 * Used so roommate pins sit at real addresses/neighbourhoods, not a grid or one spot.
 */
const KINGSTON_REAL_LOCATIONS: [number, number][] = [
  // Buildings from realtor listings (same as map listings)
  [44.2371881, -76.5026899], // 652 Princess (Sage)
  [44.2315, -76.4855],       // 223 Princess
  [44.2312, -76.4862],      // 165 Ontario
  [44.239, -76.581],        // 248 McLellan Court
  [44.2308, -76.4845],      // 161A Princess
  [44.234118, -76.599295],  // 551 Sackville
  [44.272, -76.49],         // 741 Riverview Way
  [44.264, -76.51],         // 9 Rockford Place
  [44.268, -76.495],        // 613 Halloway
  [44.262, -76.505],        // 86 Morenz Crescent
  [44.261, -76.508],        // 130 Weller
  [44.275, -76.52],         // 1621 Brookedayle
  [44.255, -76.535],        // 17 Eldon Hall Place
  [44.268, -76.488],        // 791 Newmarket Lane
  [44.276, -76.522],        // 1669 Brookedayle
  [44.265, -76.5],          // 45 Chestnut
  [44.263, -76.502],        // 34 Ruskin
  [44.262, -76.515],        // 45 Dalton
  [44.278, -76.54],         // 740 Augusta
  [44.258, -76.555],        // 847 Development
  // Queen's / downtown / neighbourhoods (real areas)
  [44.2253, -76.4951],      // Queen's campus
  [44.226, -76.494],        // Near campus
  [44.231, -76.485],        // Downtown
  [44.228, -76.505],        // West end
  [44.2298, -76.481],       // Kingston city centre
  [44.227, -76.492],        // University Ave area
  [44.2305, -76.488],       // Princess & Division
  [44.233, -76.491],        // Sydenham Ward
  [44.235, -76.497],        // Calvin Park
  [44.224, -76.498],        // Portsmouth
  [44.236, -76.488],        // Williamsville
  [44.240, -76.495],        // North of Princess
  [44.2285, -76.502],       // Earl St area
  [44.232, -76.484],        // Ontario St
  [44.2265, -76.496],       // Union St
  [44.234, -76.493],        // Princess north
  [44.238, -76.508],        // Gardiners Rd area
  [44.260, -76.512],        // Rideau area
  [44.257, -76.538],        // Bayridge
  [44.267, -76.492],        // East of Sir John A
  [44.253, -76.528],        // Westbrook
  [44.244, -76.501],        // Midtown
  [44.248, -76.495],        // Central
  [44.251, -76.518],        // West end residential
  [44.247, -76.488],        // East of campus
  [44.242, -76.505],        // Calvin Park north
  [44.256, -76.498],        // Princess & Gardiners
  [44.259, -76.502],        // Innovation Dr area
  [44.264, -76.497],        // Barriefield area
  [44.270, -76.512],        // East end
  [44.273, -76.498],        // Highway 15 area
  [44.248, -76.512],        // West of 86 Morenz
  [44.245, -76.478],        // Downtown east
  [44.223, -76.492],        // Queen's south
  [44.2318, -76.5001],      // Seed pin area
  [44.2278, -76.5012],      // Seed pin area
  [44.2295, -76.4877],      // Seed pin area
];

const FIRST_NAMES = [
  "Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn",
  "Emma", "Noah", "Olivia", "Liam", "Ava", "Ethan", "Sophia", "Mason",
  "Isabella", "William", "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas",
  "Harper", "Henry", "Evelyn", "Alexander", "Abigail", "Sebastian", "Emily", "Jack",
  "Ella", "Owen", "Scarlett", "Daniel", "Grace", "Matthew", "Chloe", "Joseph",
  "Victoria", "David", "Riley", "Carter", "Aria", "Jayden", "Lily", "Luke",
  "Avery", "Gabriel", "Zoey", "Anthony", "Penelope", "Isaac", "Layla", "Dylan",
  "Nora", "Leo", "Camila", "Lincoln", "Hannah", "Jaxon", "Lillian", "Asher",
  "Addison", "Oliver", "Eleanor", "Elijah", "Natalie", "Connor", "Luna", "Thomas",
  "Savannah", "Charles", "Brooklyn", "Caleb", "Leah", "Ryan", "Zoe", "Nathan",
];

const AREAS: string[] = [
  "Near campus", "Downtown", "West end", "East of Princess", "Skeleton Park",
  "University District", "Kingston Centre", "Calvin Park", "Williamsville",
  "Portsmouth", "Barriefield", "Cataraqui",
];

const DESCRIPTIONS_BY_CATEGORY: Record<ListingCategory, string[]> = {
  "looking-for-room-and-roommate": [
    "Student, budget ~$650–800, prefer quiet. Open to pets.",
    "Looking for a room and 1–2 roommates to find a place together.",
    "Grad student, flexible move-in. Prefer non-smoking.",
    "Budget ~$700. Would love to find a place with other students.",
    "Searching for room + roommates for Sept. Pet-free preferred.",
    "Quiet lifestyle, budget ~$750. Email to connect.",
    "Looking for room and roommate(s) near campus. $600–800 range.",
    "Flexible on area. Want to sign a lease with 1–2 others.",
    "First year, looking for room and mates. Budget ~$700.",
    "Need a room and 2 roommates for a 3BR. Prefer downtown.",
  ],
  "have-room-need-roommates": [
    "Found a 2BR, need 1 roommate. Lease from Sept. $850/mo share.",
    "Have a 3BR place, need 2 people. Move-in May or Sept.",
    "2BR downtown, need one more. Utilities included. $800.",
    "Place secured near campus, looking for 2 roommates. $750 each.",
    "3BR house west end, need 2. Pet-friendly. Available Sept.",
    "Got a 2BR, need one roommate. Quiet building. $820.",
    "Found 4BR, need 3 roommates. Split rent evenly. Sept start.",
    "2BR apartment, need 1. Laundry in building. $780.",
    "Have room in 3BR, need 2. Near Queen's. $700/mo.",
    "Place locked in for Sept. Need 2 roommates. $765 each.",
  ],
  "sublet-room": [
    "Subletting my room May–Aug. Furnished, utilities included. $650.",
    "Room available June–Aug. 3BR near campus. Quiet housemates.",
    "Sublet one room in 2BR. May 1 – Aug 31. $620/mo.",
    "Going abroad Sept–Dec. Room available, furnished. $700.",
    "Subletting room in house. 4BR, big kitchen. $680 May–Aug.",
    "Room for sublet Sept–Dec. Downtown. All utilities included.",
    "Short-term sublet May–July. Near campus. $640.",
    "Sublet room Aug–Dec. Pet-free. $690/mo incl.",
    "Room available Sept–April. Grad student preferred. $720.",
    "Subletting my room in 3BR. Jan–April. $670.",
  ],
  sublet: [],
  "share-listing": [],
  "looking-for-roommates": [],
};

const TITLES_BY_CATEGORY: Record<ListingCategory, string[]> = {
  "looking-for-room-and-roommate": [
    "Looking for room + roommate",
    "Need room and roommate(s) for Sept",
    "Searching for place and people",
    "Want room + 1–2 roommates",
    "Looking for room and roommate near campus",
    "Need room and mates for fall",
    "Searching room + roommate",
    "Looking for room + roommate (student)",
    "Want to find room and roommates together",
    "Need room and 1–2 roommates",
  ],
  "have-room-need-roommates": [
    "Have place, need 1 roommate",
    "Found 2BR, need one more",
    "Have room, need 2 roommates",
    "Place secured, need roommates",
    "2BR downtown, need 1",
    "Have 3BR, need 2 people",
    "Found place, need roommates for Sept",
    "Have room, need roommate",
    "Place locked in, need 2",
    "2BR available, need 1 roommate",
  ],
  "sublet-room": [
    "Subletting room May–Aug",
    "Room for sublet (summer)",
    "Sublet my room Sept–Dec",
    "Room available for sublet",
    "Subletting room near campus",
    "Short-term sublet May–July",
    "Room sublet Sept–April",
    "Sublet room, furnished",
    "Subletting room in 3BR",
    "Room for sublet, utilities incl.",
  ],
  sublet: [],
  "share-listing": [],
  "looking-for-roommates": [],
};

/** Deterministic 0–1 from index so positions are stable across reloads */
function frac(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

/** Small jitter ±maxOffset (in degrees) so pins don't stack on the same pixel */
function jitter(anchor: number, seed: number, maxOffset: number): number {
  return anchor + (frac(seed) * 2 - 1) * maxOffset;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(Math.abs(seed) % arr.length)]!;
}

const NUM_MOCK_PINS = 60;

/** Generate mock roommate pins at real Kingston locations (one per location, small jitter so pins don't overlap). */
function generateMockRoommates(): Pin[] {
  const categories: ListingCategory[] = [
    "looking-for-room-and-roommate",
    "have-room-need-roommates",
    "sublet-room",
  ];
  const pins: Pin[] = [];
  const baseTime = 1700000000000;
  const jitterDeg = 0.00015; // small offset so multiple pins at same area don't stack
  const anchors = KINGSTON_REAL_LOCATIONS;

  for (let i = 0; i < NUM_MOCK_PINS; i++) {
    const [anchorLat, anchorLng] = anchors[i % anchors.length]!;
    const category = categories[i % 3]!;
    const name = pick(FIRST_NAMES, i);
    const area = pick(AREAS, i * 7);
    const titleArr = TITLES_BY_CATEGORY[category];
    const descArr = DESCRIPTIONS_BY_CATEGORY[category];
    const title = titleArr.length ? pick(titleArr, i * 11) : "Roommate";
    const description = descArr.length ? pick(descArr, i * 13) : "Email to connect.";

    pins.push({
      id: `roommate-mock-${i + 1}`,
      lat: jitter(anchorLat, i * 31, jitterDeg),
      lng: jitter(anchorLng, i * 47, jitterDeg),
      rent: category === "sublet-room" ? 600 + Math.floor((i % 15) * 10) : 0,
      moveInDate: ["2025-05-01", "2025-06-01", "2025-08-01", "2025-09-01", "2025-09-15"][i % 5]!,
      type: "room",
      category,
      title: `${name}: ${title}`,
      description,
      address: area,
      areaLabel: area,
      bedrooms: category === "have-room-need-roommates" ? (i % 3) + 2 : 1,
      features: i % 4 === 0 ? ["quiet"] : i % 4 === 1 ? ["pet-free"] : i % 4 === 2 ? ["pet-friendly"] : [],
      contactEmail: `roommate${i + 1}@example.com`,
      sourceType: "seeded",
      createdAt: baseTime + i * 10000,
    });
  }

  return pins;
}

export const MOCK_ROOMMATES: Pin[] = generateMockRoommates();

const STORAGE_KEY = "pinpoint_roommates";

function getStored(): Pin[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Pin[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function getRoommatePins(): Pin[] {
  return [...MOCK_ROOMMATES, ...getStored()];
}

export function addRoommatePin(pin: Pin): void {
  const list = getStored();
  list.push({ ...pin, id: `user-rm-${Date.now()}`, sourceType: "user-added", createdAt: Date.now() });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}
