import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SELECT =
  "id, user_id, name, contact_email, budget_label, budget_min_cents, budget_max_cents, move_in, move_in_from, preferences, location_label, location_lat, location_lng, note, listing_type, source, created_at, updated_at";

/**
 * GET: Current user's person_profile (for preferences / future edits).
 * If none exists, create one from profiles + user_preferences and return it.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let { data: row, error } = await supabase
    .from("person_profiles")
    .select(SELECT)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[me/person-profile GET]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!row) {
    const [profileRes, prefsRes] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
      supabase.from("user_preferences").select("move_in_from, max_rent_cents, notes").eq("user_id", user.id).maybeSingle(),
    ]);
    const profile = profileRes.data;
    const prefs = prefsRes.data;
    const insertPayload = {
      user_id: user.id,
      name: profile?.full_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? "User",
      contact_email: profile?.email ?? user.email ?? null,
      budget_label: prefs?.max_rent_cents != null ? `$${Math.round(prefs.max_rent_cents / 100)}/mo` : null,
      budget_min_cents: null,
      budget_max_cents: prefs?.max_rent_cents ?? null,
      move_in: null,
      move_in_from: prefs?.move_in_from ?? null,
      preferences: [],
      location_label: null,
      location_lat: null,
      location_lng: null,
      note: prefs?.notes ?? null,
      listing_type: null,
      source: "user",
    };
    const { data: inserted, error: insertErr } = await supabase
      .from("person_profiles")
      .insert(insertPayload)
      .select(SELECT)
      .single();
    if (insertErr) {
      console.error("[me/person-profile GET insert]", insertErr.message);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    row = inserted;
  }

  if (row && row.move_in_from) {
    const d = row.move_in_from;
    row.move_in_from = typeof d === "string" ? d.slice(0, 10) : (d as unknown as Date)?.toISOString?.()?.slice(0, 10) ?? row.move_in_from;
  }
  return NextResponse.json(row);
}

/**
 * PATCH: Update current user's person_profile (name, preferences, location, note, etc.).
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === "string") updates.name = body.name.trim() || "User";
  if (typeof body.contact_email === "string") updates.contact_email = body.contact_email.trim() || null;
  if (typeof body.budget_label === "string") updates.budget_label = body.budget_label.trim() || null;
  if (typeof body.budget_min_cents === "number") updates.budget_min_cents = body.budget_min_cents;
  if (typeof body.budget_max_cents === "number") updates.budget_max_cents = body.budget_max_cents;
  if (typeof body.move_in === "string") updates.move_in = body.move_in.trim() || null;
  if (typeof body.move_in_from === "string") updates.move_in_from = body.move_in_from?.slice(0, 10) || null;
  if (Array.isArray(body.preferences)) updates.preferences = body.preferences;
  if (typeof body.location_label === "string") updates.location_label = body.location_label.trim() || null;
  if (typeof body.location_lat === "number") updates.location_lat = body.location_lat;
  if (typeof body.location_lng === "number") updates.location_lng = body.location_lng;
  if (typeof body.note === "string") updates.note = body.note.trim() || null;
  if (typeof body.listing_type === "string") updates.listing_type = body.listing_type.trim() || null;

  const { data: row, error } = await supabase
    .from("person_profiles")
    .update(updates)
    .eq("user_id", user.id)
    .select(SELECT)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      const { data: inserted, error: insertErr } = await supabase
        .from("person_profiles")
        .insert({
          user_id: user.id,
          name: (updates.name as string) ?? "User",
          contact_email: updates.contact_email ?? null,
          budget_label: updates.budget_label ?? null,
          budget_min_cents: updates.budget_min_cents ?? null,
          budget_max_cents: updates.budget_max_cents ?? null,
          move_in: updates.move_in ?? null,
          move_in_from: updates.move_in_from ?? null,
          preferences: (updates.preferences as string[]) ?? [],
          location_label: updates.location_label ?? null,
          location_lat: updates.location_lat ?? null,
          location_lng: updates.location_lng ?? null,
          note: updates.note ?? null,
          listing_type: updates.listing_type ?? null,
          source: "user",
        })
        .select(SELECT)
        .single();
      if (insertErr) {
        console.error("[me/person-profile PATCH insert]", insertErr.message);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      return NextResponse.json(inserted);
    }
    console.error("[me/person-profile PATCH]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(row ?? {});
}
