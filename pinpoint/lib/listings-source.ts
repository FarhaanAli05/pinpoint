/**
 * Listings data source — orchestration for "Find room" and map.
 *
 * Listings come from:
 * - Seed data + user-added pins (context)
 * - RentCast API via /api/rentcast/listings (city, state, minPrice, maxPrice)
 *   API key in RENTCAST_API_KEY env; see .env.example.
 */

import type { Pin } from "./types";

export interface RoomCriteria {
  area?: string;
  budgetMin?: number;
  budgetMax?: number;
  moveIn?: string;
  type?: "room" | "whole-unit";
  prefs?: string[];
}

/**
 * Filter pins by room criteria (area, budget, move-in, type, preferences).
 * Used when coming from "Find room" to highlight or filter listings on the map.
 * Listings data itself still comes from context (seed + user pins).
 */
export function filterListingsByCriteria(pins: Pin[], criteria: RoomCriteria): Pin[] {
  let out = pins.filter((p) => p.category === "sublet" || p.category === "share-listing");
  if (criteria.area) {
    const areaLower = criteria.area.toLowerCase();
    const keywords: string[] = areaLower === "near-campus" ? ["campus", "university", "queen"] : areaLower === "downtown" ? ["downtown", "king", "ontario", "bagot", "sydenham", "brock", "clergy"] : areaLower === "west-end" ? ["west", "johnson", "stuart", "collingwood", "earl", "alfred"] : [areaLower];
    out = out.filter((p) => {
      const text = (p.areaLabel || p.address || "").toLowerCase();
      return keywords.some((k) => text.includes(k));
    });
  }
  if (criteria.budgetMin != null) out = out.filter((p) => p.rent >= criteria.budgetMin!);
  if (criteria.budgetMax != null) out = out.filter((p) => p.rent <= criteria.budgetMax!);
  if (criteria.type) out = out.filter((p) => p.type === criteria.type);
  if (criteria.prefs?.length) {
    out = out.filter((p) => criteria.prefs!.some((pref) => p.features.includes(pref)));
  }
  return out;
}

/** Map URL budget param to min/max for filtering */
export function budgetParamToRange(param: string | null): { min?: number; max?: number } {
  if (!param) return {};
  if (param === "under-600") return { max: 600 };
  if (param === "600-800") return { min: 600, max: 800 };
  if (param === "800-1000") return { min: 800, max: 1000 };
  if (param === "1000-plus") return { min: 1000 };
  return {};
}
