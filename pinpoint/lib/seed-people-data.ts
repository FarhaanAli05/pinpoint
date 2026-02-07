/**
 * Seed data for person_profiles: names, preferences, location, budget, etc.
 * Used by API seed route to fill DB for AI comparison.
 */
import { STUDENT_PROFILES } from "./student-profiles";
import { MOCK_ROOMMATES } from "./mock-roommates";
import type { Pin } from "./types";

export interface SeedPersonRow {
  name: string;
  contact_email: string | null;
  budget_label: string | null;
  budget_min_cents: number | null;
  budget_max_cents: number | null;
  move_in: string | null;
  move_in_from: string | null;
  preferences: string[];
  location_label: string | null;
  location_lat: number | null;
  location_lng: number | null;
  note: string | null;
  listing_type: string | null;
}

const CATEGORY_TO_LISTING_TYPE: Record<string, string> = {
  "looking-for-room-and-roommate": "looking_for_room_and_roommate",
  "looking-for-roommates": "looking_for_room_and_roommate",
  "have-room-need-roommates": "have_room_need_roommates",
  "sublet-room": "sublet_room",
};

function parseBudgetLabel(label: string): { min: number | null; max: number | null } {
  const match = label.match(/\$?\s*(\d+)\s*[–-]\s*\$?\s*(\d+)/);
  if (match) return { min: parseInt(match[1], 10) * 100, max: parseInt(match[2], 10) * 100 };
  const under = label.match(/Under\s*\$?\s*(\d+)/i);
  if (under) return { min: null, max: parseInt(under[1], 10) * 100 };
  const over = label.match(/\$?\s*(\d+)\s*\+/);
  if (over) return { min: parseInt(over[1], 10) * 100, max: null };
  return { min: null, max: null };
}

/** Student profiles (Suggested matches) as seed person rows */
export function getStudentProfileSeedRows(): SeedPersonRow[] {
  return STUDENT_PROFILES.map((p) => {
    const { min, max } = parseBudgetLabel(p.budget);
    return {
      name: p.name,
      contact_email: p.contactEmail || null,
      budget_label: p.budget,
      budget_min_cents: min,
      budget_max_cents: max,
      move_in: p.moveIn,
      move_in_from: null,
      preferences: p.prefs ?? [],
      location_label: "Kingston, ON",
      location_lat: 44.231,
      location_lng: -76.486,
      note: p.note || null,
      listing_type: "looking_for_room_and_roommate",
    };
  });
}

/** Mock roommate pins as seed person rows (name from title, location from area) */
export function getMockRoommateSeedRows(): SeedPersonRow[] {
  return (MOCK_ROOMMATES as Pin[]).map((pin) => {
    const nameMatch = pin.title.match(/^([^:]+):/);
    const name = nameMatch ? nameMatch[1].trim() : pin.title.split(" ")[0] ?? "Unknown";
    const listingType = CATEGORY_TO_LISTING_TYPE[pin.category] ?? null;
    return {
      name,
      contact_email: pin.contactEmail ?? null,
      budget_label: pin.rent > 0 ? `$${pin.rent}/mo` : null,
      budget_min_cents: pin.rent > 0 ? pin.rent * 100 : null,
      budget_max_cents: pin.rent > 0 ? pin.rent * 100 : null,
      move_in: pin.moveInDate,
      move_in_from: pin.moveInDate ? pin.moveInDate.slice(0, 10) : null,
      preferences: pin.features ?? [],
      location_label: pin.areaLabel ?? pin.address ?? null,
      location_lat: pin.lat,
      location_lng: pin.lng,
      note: pin.description || null,
      listing_type: listingType,
    };
  });
}

/** All seed people rows (students + mock roommates) for DB seed */
export function getAllSeedPersonRows(): SeedPersonRow[] {
  return [...getStudentProfileSeedRows(), ...getMockRoommateSeedRows()];
}
