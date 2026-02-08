export type Dealbreaker = "pet-free" | "smoking-free" | "quiet";
export type RoommateOpenness = "yes" | "maybe" | "no";
export type PinType = "room" | "whole-unit";

/** Why the listing is on the map: sublet, share a flat (paste URL), or roommate types */
export type ListingCategory =
  | "sublet"
  | "share-listing"
  | "looking-for-roommates" // legacy; treat as looking-for-room-and-roommate
  /** Looking for a room AND a roommate */
  | "looking-for-room-and-roommate"
  /** Has room found, looking for people to share with */
  | "have-room-need-roommates"
  /** Has sublease, wants to rent out the room */
  | "sublet-room";

/** User's answer from questionnaire — what they need so we filter the map */
export type UserIntent =
  | "looking-for-room"      // I'm looking for a room/flat → show sublets + share-listings
  | "have-sublet"           // I have a place to sublet → show all (later: add listing)
  | "need-roommates"        // I found a place, need roommates → show share-listings + looking-for-roommates
  | "searching-with-mates"; // I'm searching for apartment + roommates → show looking-for-roommates + sublets

export type FitTag = "Great" | "OK" | "Conflict";
export type TrackerStatus = "saved" | "messaged" | "viewing" | "rejected";
export type SourceType = "seeded" | "user-added" | "rentcast" | "realtor";

export interface UnitMember {
  id: string;
  budgetMin: number;
  budgetMax: number;
  dealbreakers: Dealbreaker[];
}

export interface HousingUnit {
  id: string;
  code: string; // shareable join code
  moveInMonth: string; // e.g. "2025-09"
  budgetMin: number;
  budgetMax: number;
  dealbreakers: Dealbreaker[];
  roommateOpenness: RoommateOpenness;
  members: UnitMember[];
}

export interface Pin {
  id: string;
  lat: number;
  lng: number;
  rent: number;
  moveInDate: string; // e.g. "2025-09-01"
  type: PinType;
  /** sublet = have a place to sublet; share-listing = pasted URL, finding roommates; looking-for-roommates = searching in area */
  category: ListingCategory;
  title: string;
  description: string;
  address: string;
  /** Postal code (e.g. Canadian "K7L 3V5") */
  postalCode?: string;
  bedrooms: number;
  features: string[]; // e.g. ["pet-friendly", "smoking-allowed", "quiet"]
  /** For share-listing: original URL they pasted */
  externalLink?: string;
  /** Image URLs (e.g. from Kijiji) */
  images?: string[];
  /** Contact — email only */
  contactEmail?: string;
  /** Optional area for looking-for-roommates e.g. "Near Queen's campus" */
  areaLabel?: string;
  sourceType: SourceType;
  sourceLabel?: string;
  addedByUnitId?: string;
  createdAt: number;
  /** When true, show as "me" pin (yellow / person icon) from profile pinned location */
  isMe?: boolean;
  /** How many roommates they need or are looking for (from roommate listing) */
  peopleCount?: number;
  /** Optional polygon [lat, lng][] for area boundary (shown on marker click for listings) */
  boundary?: [number, number][];
}

export interface TrackedPin {
  pinId: string;
  status: TrackerStatus;
  addedAt: number; // timestamp
}
