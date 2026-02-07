import { NextRequest, NextResponse } from "next/server";

/** Kingston, ON viewbox (SW lng,lat, NE lng,lat) for biasing results */
const KINGSTON_VIEWBOX = "-76.65,44.20,-76.45,44.28";

/**
 * Search locations using OpenStreetMap Nominatim, biased to Kingston, Ontario.
 * GET /api/geocode?q=downtown
 * Returns [{ display_name, lat, lon }] — results in/around Kingston first.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  const trimmed = q.trim();
  const query = trimmed.toLowerCase().includes("kingston") || trimmed.length < 4
    ? trimmed
    : `${trimmed}, Kingston, Ontario, Canada`;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("viewbox", KINGSTON_VIEWBOX);
  url.searchParams.set("bounded", "0");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Pinpoint/1 (roommate finder; Kingston ON)" },
    });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();
    let list = Array.isArray(data)
      ? data.map((item: { lat: string; lon: string; display_name: string }) => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }))
      : [];
    if (list.length === 0 && query !== trimmed) {
      const fallback = new URL("https://nominatim.openstreetmap.org/search");
      fallback.searchParams.set("q", trimmed);
      fallback.searchParams.set("format", "json");
      fallback.searchParams.set("limit", "8");
      const r2 = await fetch(fallback.toString(), { headers: { "User-Agent": "Pinpoint/1" } });
      if (r2.ok) {
        const d2 = await r2.json();
        list = Array.isArray(d2) ? d2.map((item: { lat: string; lon: string; display_name: string }) => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        })) : [];
      }
    }
    return NextResponse.json(list);
  } catch {
    return NextResponse.json([]);
  }
}
