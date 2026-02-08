/**
 * Mock listings — replace with your team's JSON or API.
 * Placeholder: import from /api/listings or static JSON file.
 */
import type { Pin } from "./types";

export const MOCK_LISTINGS: Pin[] = [
  {
    id: "mock-1",
    lat: 44.2312,
    lng: -76.4923,
    rent: 750,
    moveInDate: "2025-09-01",
    type: "room",
    category: "sublet",
    title: "Bright room near campus",
    description: "Spacious room, 5 min walk to campus. Laundry in-unit.",
    address: "123 University Ave",
    bedrooms: 1,
    features: ["quiet", "pet-friendly"],
    contactEmail: "listing1@example.com",
    sourceType: "seeded",
    createdAt: Date.now(),
  },
  {
    id: "mock-2",
    lat: 44.2278,
    lng: -76.5012,
    rent: 1400,
    moveInDate: "2025-09-01",
    type: "whole-unit",
    category: "sublet",
    title: "2BR apartment on Alfred St",
    description: "Modern 2-bedroom, recently renovated.",
    address: "45 Alfred St",
    bedrooms: 2,
    features: ["quiet", "smoking-free"],
    contactEmail: "alfred@example.com",
    sourceType: "seeded",
    createdAt: Date.now(),
  },
  {
    id: "mock-3",
    lat: 44.2295,
    lng: -76.4877,
    rent: 650,
    moveInDate: "2025-08-15",
    type: "room",
    category: "sublet",
    title: "Room in shared house",
    description: "Friendly household, downtown area.",
    address: "89 Earl St",
    bedrooms: 1,
    features: [],
    contactEmail: "earl@example.com",
    sourceType: "seeded",
    createdAt: Date.now(),
  },
];
