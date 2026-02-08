/**
 * Kingston-area postal code (FSA) to map coordinates.
 * Each listing gets its own position within its postal code's bounding box so markers don't stack.
 * Points that would fall on Lake Ontario are snapped to the nearest land (shoreline) but kept within the FSA.
 */

/** Bounding box: [latMin, latMax, lngMin, lngMax] for each FSA. */
const FSA_BOXES: Record<string, [number, number, number, number]> = {
  K7K: [44.224, 44.242, -76.502, -76.468], // downtown, Rideau Heights, Kingscourt
  K7L: [44.208, 44.238, -76.518, -76.478], // Queen's, Sunnyside, Williamsville
  K7M: [44.225, 44.262, -76.538, -76.488], // west end, Bayridge, Polson Park
  K7N: [44.218, 44.242, -76.532, -76.498], // Kingston south
  K7P: [44.235, 44.265, -76.498, -76.452], // Cataraqui, east
  K0E: [44.198, 44.238, -76.400, -76.355], // Leeds / Thousand Islands (e.g. Amherstview)
  K0H: [44.285, 44.358, -76.505, -76.415], // South Frontenac, Verona, Perth Road
};

/**
 * Lake Ontario shoreline near Kingston: minimum latitude that is land at each longitude.
 * Buffered ~1 km north of the water so markers stay clearly on land. [lng, minLat] pairs (lng ascending).
 */
const SHORELINE_LNG_LAT: [number, number][] = [
  [-76.54, 44.222],
  [-76.52, 44.224],
  [-76.50, 44.228],
  [-76.48, 44.232],
  [-76.46, 44.236],
  [-76.44, 44.238],
  [-76.42, 44.238],
  [-76.40, 44.232],
  [-76.38, 44.228],
  [-76.36, 44.224],
  [-76.355, 44.222],
];

/** Interpolate minimum land latitude at given longitude (south of this = in lake). */
export function minLandLatAtLng(lng: number): number {
  if (lng <= SHORELINE_LNG_LAT[0][0]) return SHORELINE_LNG_LAT[0][1];
  if (lng >= SHORELINE_LNG_LAT[SHORELINE_LNG_LAT.length - 1][0])
    return SHORELINE_LNG_LAT[SHORELINE_LNG_LAT.length - 1][1];
  for (let i = 0; i < SHORELINE_LNG_LAT.length - 1; i++) {
    const [lng0, lat0] = SHORELINE_LNG_LAT[i];
    const [lng1, lat1] = SHORELINE_LNG_LAT[i + 1];
    if (lng >= lng0 && lng <= lng1) {
      const t = (lng - lng0) / (lng1 - lng0);
      return lat0 + t * (lat1 - lat0);
    }
  }
  return SHORELINE_LNG_LAT[0][1];
}

/**
 * If (lat, lng) is in the lake, snap to nearest land (shoreline) at that longitude.
 * Then clamp to the FSA box so the point stays within the postal code.
 */
function snapToLandInBox(
  lat: number,
  lng: number,
  box: [number, number, number, number]
): { lat: number; lng: number } {
  const [latMin, latMax, lngMin, lngMax] = box;
  const lngClamped = Math.max(lngMin, Math.min(lngMax, lng));
  const minLand = minLandLatAtLng(lngClamped);
  let outLat = lat < minLand ? minLand : lat;
  outLat = Math.max(latMin, Math.min(latMax, outLat));
  outLat = Math.max(outLat, minLandLatAtLng(lngClamped));
  outLat = Math.max(latMin, Math.min(latMax, outLat));
  return { lat: outLat, lng: lngClamped };
}

/** True if (lat, lng) is on land (at or north of the shoreline), not on the lake. */
export function isPointOnLand(lat: number, lng: number): boolean {
  return lat >= minLandLatAtLng(lng);
}

function toFSA(postalCode: string): string {
  const s = String(postalCode ?? "").replace(/\s+/g, "").toUpperCase().trim();
  if (s.length >= 3) return s.slice(0, 3);
  return s || "";
}

/** Deterministic hash to 0..1 so same listing always gets same position. */
function hashTo01(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 10000) / 10000;
}
function hashTo01b(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 17 + s.charCodeAt(i) * 7) >>> 0;
  return (h % 10000) / 10000;
}

/**
 * Returns a unique position for this listing within its postal code area.
 * Same listingId + postalCode always yields the same point; different listings spread within the FSA box.
 */
export function getCoordsForPostalCode(
  postalCode: string,
  listingId?: string
): { lat: number; lng: number } | null {
  const normalized = String(postalCode ?? "").replace(/\s+/g, "").toUpperCase().trim();
  if (!normalized || normalized.length < 3) return null;

  const fsa = toFSA(normalized);
  const box = FSA_BOXES[fsa];
  if (!box) return null;

  const [latMin, latMax, lngMin, lngMax] = box;
  const seed = listingId ? `${listingId}|${normalized}` : normalized;
  const u = hashTo01(seed);
  const v = hashTo01b(seed);

  const lat = latMin + u * (latMax - latMin);
  const lng = lngMin + v * (lngMax - lngMin);

  return snapToLandInBox(lat, lng, box);
}
