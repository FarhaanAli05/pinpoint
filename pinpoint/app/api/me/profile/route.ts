import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET: Current user's profile + preferences for view/edit and for pre-filling "Add pin" form.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profileRes, prefsRes] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase.from("user_preferences").select("move_in_from, max_rent_cents, notes").eq("user_id", user.id).maybeSingle(),
  ]);

  const profile = profileRes.data ?? null;
  let prefs = prefsRes.data;
  if (!prefs && !prefsRes.error) {
    const { data: inserted } = await supabase
      .from("user_preferences")
      .insert({
        user_id: user.id,
        move_in_from: null,
        max_rent_cents: null,
        notes: null,
      })
      .select("move_in_from, max_rent_cents, notes")
      .single();
    prefs = inserted ?? null;
  }

  return NextResponse.json({
    profile: {
      full_name: profile?.full_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
      email: profile?.email ?? user.email ?? "",
    },
    preferences: prefs
      ? {
          move_in_from: prefs.move_in_from ?? null,
          max_rent_cents: prefs.max_rent_cents ?? null,
          notes: prefs.notes ?? null,
        }
      : {
          move_in_from: null,
          max_rent_cents: null,
          notes: null,
        },
  });
}

/**
 * PATCH: Update profile and preferences (name, email, move-in, budget, notes).
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    full_name?: string;
    email?: string;
    move_in_from?: string;
    max_rent_cents?: number | null;
    notes?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { full_name, email, move_in_from, max_rent_cents, notes } = body;

  if (full_name !== undefined) {
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: full_name?.trim() ?? null, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) {
      console.error("[me/profile PATCH profile]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  if (email !== undefined) {
    const { error } = await supabase
      .from("profiles")
      .update({ email: email?.trim() ?? null, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) {
      console.error("[me/profile PATCH email]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const hasPrefs = move_in_from !== undefined || max_rent_cents !== undefined || notes !== undefined;
  if (hasPrefs) {
    const { data: existing } = await supabase.from("user_preferences").select("move_in_from, max_rent_cents, notes").eq("user_id", user.id).maybeSingle();
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        move_in_from: move_in_from !== undefined ? move_in_from.slice(0, 10) : existing?.move_in_from ?? null,
        max_rent_cents: max_rent_cents !== undefined ? max_rent_cents : existing?.max_rent_cents ?? null,
        notes: notes !== undefined ? (notes?.trim() ?? null) : existing?.notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) {
      console.error("[me/profile PATCH preferences]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
