"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type PreferredType = "rent" | "lease" | "sublet";

export type SavePreferencesInput = {
  preferredTypes: PreferredType[];
  locationEstimate: string | null;
  moveInFrom: string; // YYYY-MM-DD
  moveInTo: string | null; // YYYY-MM-DD
  maxRentCents: number | null;
  notes: string | null;
};

export async function savePreferences(input: SavePreferencesInput): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { preferredTypes, locationEstimate, moveInFrom, moveInTo, maxRentCents, notes } = input;

  const { error: prefError } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      preferred_types: preferredTypes.length ? preferredTypes : [],
      location_estimate: locationEstimate?.trim() || null,
      move_in_from: moveInFrom,
      move_in_to: moveInTo || null,
      max_rent_cents: maxRentCents ?? null,
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (prefError) return { error: prefError.message };

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? undefined,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
      onboarded_at: new Date().toISOString(),
      where_looking: locationEstimate?.trim() || undefined,
      from_when: moveInFrom,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) return { error: profileError.message };

  revalidatePath("/");
  revalidatePath("/onboard");
  revalidatePath("/listings");
  return {};
}
