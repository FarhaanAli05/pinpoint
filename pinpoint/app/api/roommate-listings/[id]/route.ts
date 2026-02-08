import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * DELETE: Remove a roommate listing. Auth required; only the owner can delete.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const listingId = id?.trim();
  if (!listingId || !UUID_REGEX.test(listingId)) {
    return NextResponse.json({ error: "Valid listing id required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("roommate_listings")
    .select("id")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Listing not found or you can't delete it" }, { status: 404 });
  }

  const { error } = await supabase
    .from("roommate_listings")
    .delete()
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[roommate-listings DELETE]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
