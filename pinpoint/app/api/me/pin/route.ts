import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Pin } from "@/lib/types";

/**
 * GET: Current user's pinned "me" location (from profiles). Returns null if not set.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ pin: null });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("pinned_lat, pinned_lng, pinned_at, pinned_type, pinned_note, full_name, email")
    .eq("id", user.id)
    .single();

  if (error || !profile?.pinned_lat || !profile?.pinned_lng) {
    return NextResponse.json({ pin: null });
  }

  const pin: Pin = {
    id: `me-${user.id}`,
    lat: Number(profile.pinned_lat),
    lng: Number(profile.pinned_lng),
    rent: 0,
    moveInDate: new Date().toISOString().slice(0, 10),
    type: "room",
    category: profile.pinned_type === "need-roommates" ? "looking-for-roommates" : "looking-for-room-and-roommate",
    title: profile.pinned_type === "need-roommates" ? "Me: looking for roommates here" : "Me: looking for a room here",
    description: profile.pinned_note ?? "My pinned location",
    address: "Pinned on map",
    bedrooms: 1,
    features: [],
    contactEmail: profile.email ?? undefined,
    areaLabel: "You",
    sourceType: "user-added",
    createdAt: profile.pinned_at ? new Date(profile.pinned_at).getTime() : Date.now(),
    isMe: true,
  };
  return NextResponse.json({ pin });
}

/**
 * PATCH: Set or clear current user's pinned location. Body: { lat, lng, type: 'need-room'|'need-roommates', note?: string } or { clear: true }.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { lat?: number; lng?: number; type?: "need-room" | "need-roommates"; note?: string; clear?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.clear) {
    const { error } = await supabase
      .from("profiles")
      .update({
        pinned_lat: null,
        pinned_lng: null,
        pinned_at: null,
        pinned_type: null,
        pinned_note: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, pin: null });
  }

  const { lat, lng, type, note } = body;
  if (typeof lat !== "number" || typeof lng !== "number" || !type) {
    return NextResponse.json({ error: "lat, lng, and type required (or clear: true)" }, { status: 400 });
  }
  if (type !== "need-room" && type !== "need-roommates") {
    return NextResponse.json({ error: "type must be need-room or need-roommates" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      pinned_lat: lat,
      pinned_lng: lng,
      pinned_at: new Date().toISOString(),
      pinned_type: type,
      pinned_note: note?.trim() ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
