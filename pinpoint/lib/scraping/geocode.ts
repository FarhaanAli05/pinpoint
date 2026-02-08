/**
 * Re-export from shared geocode module. Use lib/geocode and lib/listings-geocode for new code.
 */
import { geocodeAddress as geocode, inferGeocodeOptions } from "../geocode";

export type { GeocodeResult } from "../geocode";

export async function geocodeAddress(
  address: string,
  city?: string,
  region?: string
) {
  const hint = [city, region].filter(Boolean).join(", ");
  const options = hint ? { regionHint: hint } : inferGeocodeOptions(address);
  return geocode(address, options);
}
