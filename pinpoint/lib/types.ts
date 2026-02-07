export type Dealbreaker = "pet-free" | "smoking-free" | "quiet";
export type RoommateOpenness = "yes" | "maybe" | "no";
export type PinType = "room" | "whole-unit";
export type FitTag = "Great" | "OK" | "Conflict";
export type TrackerStatus = "saved" | "messaged" | "viewing" | "rejected";

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
}

export interface TrackedPin {
  pinId: string;
  status: TrackerStatus;
  addedAt: number; // timestamp
}
