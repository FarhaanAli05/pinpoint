/**
 * Geocode addresses to lat/lng for map placement.
 * Uses OpenStreetMap Nominatim. Rate limit ~1 req/s — use sparingly.
 *
 * Used by: listings ingest (AI/scraper), batch geocode, any source that adds map pins.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName?: string;
}

export interface GeocodeOptions {
  /** Hint for biasing results, e.g. "Kingston, Ontario, Canada" */
  regionHint?: string;
  /** Nominatim viewbox: "minLng,minLat,maxLng,maxLat" for result bias */
  viewbox?: string;
  /** Country code(s) to limit search, e.g. "ca" */
  countryCodes?: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Geocode an address to lat/lng.
 * Infers region from address when possible (e.g. "Kingston" → Ontario bias).
 * No hardcoded locations — pass options or let Nominatim resolve from address.
 */
export async function geocodeAddress(
  address: string,
  options?: GeocodeOptions
): Promise<GeocodeResult | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const query = options?.regionHint
    ? `${trimmed}, ${options.regionHint}`.replace(/,+\s*,/g, ",").trim()
    : trimmed;

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
  });
  if (options?.viewbox) params.set("viewbox", options.viewbox);
  if (options?.viewbox) params.set("bounded", "0");
  if (options?.countryCodes) params.set("countrycodes", options.countryCodes);

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

/**
 * Infer geocode options from an address string.
 * Extracts city/region cues to bias results. Add new regions here as needed.
 */
export function inferGeocodeOptions(address: string): GeocodeOptions {
  const lower = address.toLowerCase();
  if (lower.includes("kingston") || lower.includes("gananoque") || lower.includes("bath")) {
    return { regionHint: "Ontario, Canada", viewbox: "-76.70,44.15,-76.10,44.40", countryCodes: "ca" };
  }
  if (lower.includes("toronto")) {
    return { regionHint: "Ontario, Canada", viewbox: "-79.6,43.5,-79.1,43.9", countryCodes: "ca" };
  }
  if (lower.includes("vancouver") || lower.includes("bc") || lower.includes("british columbia")) {
    return { regionHint: "British Columbia, Canada", countryCodes: "ca" };
  }
  if (lower.includes("montreal") || lower.includes("québec") || lower.includes("quebec")) {
    return { regionHint: "Quebec, Canada", countryCodes: "ca" };
  }
  if (lower.includes("ontario")) {
    return { regionHint: "Ontario, Canada", countryCodes: "ca" };
  }
  return { countryCodes: "ca" };
}
