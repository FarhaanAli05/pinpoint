import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getAllSeedPersonRows } from "@/lib/seed-people-data";

/**
 * POST /api/seed/person-profiles
 * Inserts all seed people data (names, preferences, location, budget, etc.) into person_profiles.
 * Requires SUPABASE_SERVICE_ROLE_KEY. Run migration 007 first (creates person_profiles table).
 */
export async function POST() {
  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL required" },
      { status: 500 }
    );
  }

  let seedUserId: string;
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
    if (error) {
      return NextResponse.json({ error: "Failed to list users: " + error.message }, { status: 500 });
    }
    if (!users?.length) {
      return NextResponse.json(
        { error: "No users in auth. Sign up at least one user, then run this seed again." },
        { status: 400 }
      );
    }
    seedUserId = users[0].id;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  const rows = getAllSeedPersonRows().map((r) => ({
    user_id: seedUserId,
    name: r.name,
    contact_email: r.contact_email,
    budget_label: r.budget_label,
    budget_min_cents: r.budget_min_cents,
    budget_max_cents: r.budget_max_cents,
    move_in: r.move_in,
    move_in_from: r.move_in_from,
    preferences: r.preferences,
    location_label: r.location_label,
    location_lat: r.location_lat,
    location_lng: r.location_lng,
    note: r.note,
    listing_type: r.listing_type,
    source: "seed",
  }));

  const { data, error } = await supabase.from("person_profiles").insert(rows).select("id");

  if (error) {
    if (error.message?.includes("person_profiles") || error.message?.includes("does not exist")) {
      return NextResponse.json(
        { error: "Run migration 007 (create person_profiles table) in Supabase SQL Editor first. " + error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    inserted: data?.length ?? rows.length,
    message: "Person profiles (names, preferences, location, budget) inserted with source='seed' for AI comparison.",
  });
}
