/**
 * Geocode an address to lat/lng so scraped listings can be placed on the map.
 * Uses OpenStreetMap Nominatim (free, no key). Use sparingly (rate limit ~1 req/s).
 *
 * Scraping flow: scrape listing page → extract address, rent, etc. → geocode here → output Pin with lat/lng.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName?: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(address: string, city?: string, region?: string): Promise<GeocodeResult | null> {
  const query = [address, city, region].filter(Boolean).join(", ");
  if (!query.trim()) return null;

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
  });

  try {
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { "User-Agent": "Pinpoint/1.0 (housing map)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : data;
    if (!first?.lat || !first?.lon) return null;
    return {
      lat: Number(first.lat),
      lng: Number(first.lon),
      displayName: first.display_name,
    };
  } catch {
    return null;
  }
}
