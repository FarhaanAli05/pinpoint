import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/person-profiles
 * Returns all person profiles (name, preferences, location, budget, etc.) for AI comparison and UI.
 * Optional ?source=seed to get only seed data.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("person_profiles")
    .select("id, user_id, name, contact_email, budget_label, budget_min_cents, budget_max_cents, move_in, move_in_from, preferences, location_label, location_lat, location_lng, note, listing_type, source, created_at")
    .order("created_at", { ascending: false });

  if (source === "seed" || source === "user") {
    query = query.eq("source", source);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
