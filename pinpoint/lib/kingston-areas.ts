/**
 * Kingston (ON) and nearby area centers and boundaries for listing map placement.
 * Listings are placed at the center of their residential area with an optional
 * boundary polygon shown on marker click. Coordinates are approximate residential
 * centers (not exact addresses) so pins stay on land.
 */

export interface AreaDef {
  center: { lat: number; lng: number };
  /** Polygon [lat, lng][] for boundary highlight (listing is within this area) */
  boundary: [number, number][];
}

/** Approx radius in degrees for boundary (~0.006 ≈ 600m). */
const BOUNDARY_RADIUS = 0.006;

/** Generate a simple polygon (circle approximation) around a center. */
function circlePolygon(lat: number, lng: number, radiusDeg = BOUNDARY_RADIUS, points = 16): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dy = radiusDeg * Math.cos(angle);
    const dx = (radiusDeg * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180);
    out.push([lat + dy, lng + dx]);
  }
  return out;
}

/** Kingston and region area definitions: residential centers + boundary polygon. */
const AREAS: Record<string, AreaDef> = {
  // Downtown / core
  kingston: {
    center: { lat: 44.231, lng: -76.485 },
    boundary: circlePolygon(44.231, -76.485),
  },
  sunnyside: {
    center: { lat: 44.218, lng: -76.512 },
    boundary: circlePolygon(44.218, -76.512),
  },
  sydenham: {
    center: { lat: 44.232, lng: -76.498 },
    boundary: circlePolygon(44.232, -76.498),
  },
  "inner harbour": {
    center: { lat: 44.229, lng: -76.478 },
    boundary: circlePolygon(44.229, -76.478),
  },
  "mile square": {
    center: { lat: 44.235, lng: -76.495 },
    boundary: circlePolygon(44.235, -76.495),
  },
  "polson park": {
    center: { lat: 44.228, lng: -76.488 },
    boundary: circlePolygon(44.228, -76.488),
  },
  auden: {
    center: { lat: 44.208, lng: -76.512 },
    boundary: circlePolygon(44.208, -76.512),
  },
  "auden park": {
    center: { lat: 44.208, lng: -76.512 },
    boundary: circlePolygon(44.208, -76.512),
  },
  portsmouth: {
    center: { lat: 44.242, lng: -76.528 },
    boundary: circlePolygon(44.242, -76.528),
  },
  "cataraqui westbrook": {
    center: { lat: 44.250, lng: -76.518 },
    boundary: circlePolygon(44.250, -76.518),
  },
  "cataraqui river east": {
    center: { lat: 44.213, lng: -76.505 },
    boundary: circlePolygon(44.213, -76.505),
  },
  "cataraqui north": {
    center: { lat: 44.258, lng: -76.498 },
    boundary: circlePolygon(44.258, -76.498),
  },
  "sutton mills": {
    center: { lat: 44.240, lng: -76.526 },
    boundary: circlePolygon(44.240, -76.526),
  },
  "bayridge east": {
    center: { lat: 44.248, lng: -76.508 },
    boundary: circlePolygon(44.248, -76.508),
  },
  kingscourt: {
    center: { lat: 44.246, lng: -76.515 },
    boundary: circlePolygon(44.246, -76.515),
  },
  williamsville: {
    center: { lat: 44.243, lng: -76.472 },
    boundary: circlePolygon(44.243, -76.472),
  },
  alwington: {
    center: { lat: 44.212, lng: -76.478 },
    boundary: circlePolygon(44.212, -76.478),
  },
  queens: {
    center: { lat: 44.225, lng: -76.496 },
    boundary: circlePolygon(44.225, -76.496),
  },
  "greenwood - st lawrence south": {
    center: { lat: 44.246, lng: -76.472 },
    boundary: circlePolygon(44.246, -76.472),
  },
  "south frontenac": {
    center: { lat: 44.398, lng: -76.52 },
    boundary: circlePolygon(44.398, -76.52, 0.012),
  },
  "perth road": {
    center: { lat: 44.285, lng: -76.485 },
    boundary: circlePolygon(44.285, -76.485, 0.01),
  },
  gananoque: {
    center: { lat: 44.330, lng: -76.162 },
    boundary: circlePolygon(44.330, -76.162, 0.008),
  },
  "loyalist (bath)": {
    center: { lat: 44.183, lng: -76.745 },
    boundary: circlePolygon(44.183, -76.745, 0.008),
  },
};

/** Normalize address to area key for lookup (e.g. "Sunnyside, Kingston" → "sunnyside"). */
function addressToAreaKey(address: string): string {
  const s = String(address ?? "").trim().toLowerCase();
  if (!s) return "kingston";
  const parts = s.split(",").map((p) => p.trim().toLowerCase());
  const first = (parts[0] ?? "").replace(/\s+/g, " ").trim();
  const second = parts[1] ?? "";
  const combined = `${first}, ${second}`;
  if (AREAS[combined]) return combined;
  if (AREAS[first]) return first;
  const alt = first.replace(/\s*-\s*/g, " - ");
  if (AREAS[alt]) return alt;
  if (second && AREAS[second]) return second;
  return "kingston";
}

/**
 * Resolve listing address to area center and boundary. Ignores stored lat/lng;
 * use for placing Kijiji/listings on the map by residential area.
 */
export function getAreaForAddress(address: string): AreaDef {
  const key = addressToAreaKey(address);
  return AREAS[key] ?? AREAS.kingston;
}
