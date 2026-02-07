/**
 * Geocoding helpers for property listings.
 * Used when ingesting listings from AI, scrapers, or any external source.
 * Ensures map pins are placed at correct addresses.
 */

import { geocodeAddress, inferGeocodeOptions } from "./geocode";

export interface ListingData {
  address?: string;
  title?: string;
  lat?: number;
  lng?: number;
  [key: string]: unknown;
}

/** Build best geocode query from listing data (address, title with street, etc.) */
export function extractGeocodeQuery(data: ListingData): string {
  const addr = String(data.address ?? "").trim();
  const title = String(data.title ?? "").trim();

  const streetMatch =
    title.match(/\d+[\s-]*(?:[\w.]+\s+)?(?:st|street|str|str\.|road|rd|ave|avenue|court|ct|place|pl|drive|dr|blvd|way|crescent|cres)/i) ||
    title.match(/(\d+\s+[\w\s]+(?:st|str|road|rd|ave|court|place|drive|blvd))/i);
  const streetFromTitle = streetMatch ? streetMatch[0].trim() : "";

  const parts = [streetFromTitle, addr].filter(Boolean);
  return parts.join(", ") || title;
}

/** Check if lat/lng are valid and within sane bounds */
export function hasValidCoords(data: ListingData): boolean {
  const lat = data.lat;
  const lng = data.lng;
  if (lat == null || lng == null) return false;
  const a = typeof lat === "number" ? lat : parseFloat(String(lat));
  const b = typeof lng === "number" ? lng : parseFloat(String(lng));
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return a >= -90 && a <= 90 && b >= -180 && b <= 180;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fallback when geocoding fails — center of inferred region from address. */
function getFallbackCoords(query: string): { lat: number; lng: number } {
  const opts = inferGeocodeOptions(query);
  if (opts.viewbox) {
    const [minLng, minLat, maxLng, maxLat] = opts.viewbox.split(",").map(Number);
    return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
  }
  return { lat: 43.65, lng: -79.38 };
}

/**
 * Ensure a listing has valid lat/lng. Geocodes from address if missing or invalid.
 * Use when ingesting from AI, scrapers, or any source.
 */
export async function ensureListingCoords(
  data: ListingData,
  options?: { rateLimitMs?: number }
): Promise<ListingData & { lat: number; lng: number }> {
  if (hasValidCoords(data)) {
    const lat = typeof data.lat === "number" ? data.lat : parseFloat(String(data.lat));
    const lng = typeof data.lng === "number" ? data.lng : parseFloat(String(data.lng));
    return { ...data, lat, lng };
  }

  const query = extractGeocodeQuery(data);
  if (!query.trim()) {
    const fallback = getFallbackCoords(String(data.address || data.title || ""));
    return { ...data, ...fallback };
  }

  const geoOptions = inferGeocodeOptions(query);
  const result = await geocodeAddress(query, geoOptions);

  if (result) {
    if (options?.rateLimitMs) await sleep(options.rateLimitMs);
    return { ...data, lat: result.lat, lng: result.lng };
  }

  const fallback = getFallbackCoords(query);
  return { ...data, ...fallback };
}
