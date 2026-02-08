import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { MOCK_ROOMMATES } from "@/lib/mock-roommates";
import type { Pin } from "@/lib/types";

const CATEGORY_TO_DB_TYPE: Record<string, string> = {
  "looking-for-room-and-roommate": "looking_for_room_and_roommate",
  "looking-for-roommates": "looking_for_room_and_roommate",
  "have-room-need-roommates": "have_room_need_roommates",
  "sublet-room": "sublet_room",
};

/**
 * POST /api/seed/roommate-listings
 * Inserts mock roommate data into the database (source='seed') for AI comparison.
 * Requires SUPABASE_SERVICE_ROLE_KEY. Uses the first user in auth as the seed owner.
 * Run migration 006 first (adds source column).
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

  const rows = (MOCK_ROOMMATES as Pin[]).map((pin) => {
    const listingType = CATEGORY_TO_DB_TYPE[pin.category] ?? "looking_for_room_and_roommate";
    return {
      user_id: seedUserId,
      listing_type: listingType,
      title: pin.title,
      description: pin.description ?? null,
      address: pin.address ?? null,
      area_label: pin.areaLabel ?? pin.address ?? null,
      lat: pin.lat,
      lng: pin.lng,
      move_in_from: pin.moveInDate ? pin.moveInDate.slice(0, 10) : null,
      rent_cents: pin.rent > 0 ? pin.rent * 100 : null,
      contact_email: pin.contactEmail ?? null,
      source: "seed",
    };
  });

  const { data, error } = await supabase.from("roommate_listings").insert(rows).select("id");

  if (error) {
    if (error.message?.includes("source") || error.message?.includes("column")) {
      return NextResponse.json(
        { error: "Run migration 006 (add source column) in Supabase SQL Editor first. " + error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    inserted: data?.length ?? rows.length,
    message: "Mock roommate data inserted with source='seed' for AI comparison.",
  });
}
