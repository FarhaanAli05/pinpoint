export type Dealbreaker = "pet-free" | "smoking-free" | "quiet";
export type RoommateOpenness = "yes" | "maybe" | "no";
export type PinType = "room" | "whole-unit";
export type FitTag = "Great" | "OK" | "Conflict";
export type TrackerStatus = "saved" | "messaged" | "viewing" | "rejected";
export type SourceType = "seeded" | "user-added";

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
  title: string;
  description: string;
  address: string;
  bedrooms: number;
  features: string[]; // e.g. ["pet-friendly", "smoking-allowed", "quiet"]
  externalLink?: string;
  // Provenance — Pinpoint does not own listings; these fields clarify where they came from
  sourceType: SourceType;
  sourceLabel?: string; // e.g. "Facebook Marketplace", "Kijiji"
  addedByUnitId?: string;
  createdAt: number; // timestamp
}

export interface TrackedPin {
  pinId: string;
  status: TrackerStatus;
  addedAt: number; // timestamp
}

// --- Roommate Matchmaking ---

export type LifestyleLevel = "low" | "medium" | "high";
export type SleepSchedule = "early" | "medium" | "late";

export interface RoommateProfile {
  id: string;
  name: string; // first name only
  program?: string; // e.g. "Engineering, 2nd year"
  budgetMin: number;
  budgetMax: number;
  moveInMonth: string; // e.g. "2025-09"
  dealbreakers: Dealbreaker[];
  cleanliness: LifestyleLevel;
  sleepSchedule: SleepSchedule;
  guests: LifestyleLevel;
  aboutMe?: string;
  createdAt: number; // timestamp
}
