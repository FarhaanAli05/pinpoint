import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Pin, ListingCategory } from "@/lib/types";

/** Map DB listing_type (snake) to Pin category (kebab) */
const DB_TYPE_TO_CATEGORY: Record<string, ListingCategory> = {
  looking_for_room_and_roommate: "looking-for-room-and-roommate",
  have_room_need_roommates: "have-room-need-roommates",
  sublet_room: "sublet-room",
};

const CATEGORY_TO_DB_TYPE: Record<string, string> = {
  "looking-for-room-and-roommate": "looking_for_room_and_roommate",
  "looking-for-roommates": "looking_for_room_and_roommate",
  "have-room-need-roommates": "have_room_need_roommates",
  "sublet-room": "sublet_room",
};

function rowToPin(
  row: {
    id: string;
    user_id: string;
    listing_type: string;
    title: string;
    description: string | null;
    address: string | null;
    area_label: string | null;
    lat: number | null;
    lng: number | null;
    move_in_from: string | null;
    move_in_to: string | null;
    rent_cents: number | null;
    contact_email: string | null;
    people_count?: number | null;
    created_at: string;
  },
  isMe?: boolean
): Pin {
  const category = DB_TYPE_TO_CATEGORY[row.listing_type] ?? "looking-for-room-and-roommate";
  const lat = row.lat != null ? Number(row.lat) : 44.231;
  const lng = row.lng != null ? Number(row.lng) : -76.486;
  return {
    id: row.id,
    lat,
    lng,
    rent: row.rent_cents != null ? Math.round(row.rent_cents / 100) : 0,
    moveInDate: row.move_in_from ?? new Date().toISOString().slice(0, 10),
    type: "room",
    category,
    title: row.title,
    description: row.description ?? "",
    address: row.address ?? "",
    bedrooms: 1,
    features: [],
    contactEmail: row.contact_email ?? undefined,
    areaLabel: row.area_label ?? undefined,
    peopleCount: row.people_count != null ? Number(row.people_count) : undefined,
    sourceType: "user-added",
    createdAt: new Date(row.created_at).getTime(),
    isMe: !!isMe,
  };
}

/** Columns to select — people_count from migration 005; source from 006 */
const SELECT_COLUMNS = "id, user_id, listing_type, title, description, address, area_label, lat, lng, move_in_from, move_in_to, rent_cents, contact_email, people_count, created_at";

/**
 * GET: Fetch all roommate listings from DB. Pins belonging to the current user have isMe: true (one user can have multiple pins).
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("roommate_listings")
      .select(SELECT_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[roommate-listings GET]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const pins: Pin[] = (data ?? []).map((row) => rowToPin(row, user?.id != null && row.user_id === user.id));
    return NextResponse.json(pins, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[roommate-listings GET]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST: Add a roommate listing (auth required). Body: Pin-like { lat, lng, category, title, description?, contactEmail?, address?, areaLabel?, moveInDate?, rent? }
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { lat: number; lng: number; category: string; title: string; description?: string; contactEmail?: string; address?: string; areaLabel?: string; moveInDate?: string; rent?: number; peopleCount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { lat, lng, category, title, description, contactEmail, address, areaLabel, moveInDate, rent, peopleCount } = body;
  if (typeof lat !== "number" || typeof lng !== "number" || !category || !title?.trim()) {
    return NextResponse.json({ error: "lat, lng, category, and title required" }, { status: 400 });
  }

  const listingType = CATEGORY_TO_DB_TYPE[category] ?? "looking_for_room_and_roommate";
  const moveInFrom = moveInDate ? moveInDate.slice(0, 10) : null;
  const rentCents = typeof rent === "number" && rent > 0 ? Math.round(rent * 100) : null;
  const people = typeof peopleCount === "number" && peopleCount >= 1 && peopleCount <= 20 ? peopleCount : null;

  const insertPayload = {
    user_id: user.id,
    listing_type: listingType,
    title: title.trim(),
    description: description?.trim() ?? null,
    address: address?.trim() ?? null,
    area_label: areaLabel?.trim() ?? null,
    lat,
    lng,
    move_in_from: moveInFrom,
    rent_cents: rentCents,
    contact_email: contactEmail?.trim() ?? null,
    people_count: people,
  };

  try {
    const { data: row, error } = await supabase
      .from("roommate_listings")
      .insert(insertPayload)
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      console.error("[roommate-listings POST]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(rowToPin(row, true));
  } catch (err) {
    console.error("[roommate-listings POST]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
