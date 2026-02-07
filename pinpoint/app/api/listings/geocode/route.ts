import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { extractGeocodeQuery, ensureListingCoords } from "@/lib/listings-geocode";

const RATE_LIMIT_MS = 1100;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST /api/listings/geocode
 * Geocodes all property_listings by address and updates lat/lng in the DB.
 * Uses shared geocode logic (lib/geocode, lib/listings-geocode). No hardcoded locations.
 * Requires SUPABASE_SERVICE_ROLE_KEY.
 */
export async function POST() {
  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY required" },
      { status: 500 }
    );
  }

  const { data: rows, error } = await supabase
    .from("property_listings")
    .select("id, data");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let updated = 0;
  for (const row of rows ?? []) {
    const d = row.data as Record<string, unknown>;
    const query = extractGeocodeQuery(d);
    if (!query.trim()) continue;

    const withCoords = await ensureListingCoords(d);
    const newData = { ...d, lat: withCoords.lat, lng: withCoords.lng };
    const { error: updateErr } = await supabase
      .from("property_listings")
      .update({ data: newData })
      .eq("id", row.id);

    if (!updateErr) updated++;
    await sleep(RATE_LIMIT_MS);
  }

  return NextResponse.json({ ok: true, updated, total: rows?.length ?? 0 });
}
