import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import path from "path";
import fs from "fs";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

type Ranking = { id: string; rank: number; reason: string; title?: string; areaLabel?: string; rent?: number; moveInDate?: string };

/** Try to read GEMINI_API_KEY from parent folder .env (when app lives in subfolder e.g. pinpoint/pinpoint/) */
function loadGeminiKeyFromParentEnv(): string {
  try {
    const parentEnv = path.join(process.cwd(), "..", ".env");
    if (!fs.existsSync(parentEnv)) return "";
    const content = fs.readFileSync(parentEnv, "utf8");
    const match = content.match(/GEMINI_API_KEY\s*=\s*["']?([^\s#"']+)["']?/m);
    return (match?.[1] ?? "").trim();
  } catch {
    return "";
  }
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) apiKey = loadGeminiKeyFromParentEnv();
  if (!apiKey) {
    console.error("[ai-insights] GEMINI_API_KEY not set. Check .env in app root or parent folder.");
    return NextResponse.json(
      { error: "AI not configured. Add GEMINI_API_KEY to .env in the app folder (or parent folder) and restart." },
      { status: 503 }
    );
  }

  // Tables: profiles + user_preferences = current user (seeker). roommate_listings = map pins from all users. person_profiles = seed/other people for AI to rank.
  const [profileRes, prefsRes, listingsRes, personProfilesRes] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase.from("user_preferences").select("move_in_from, max_rent_cents, notes").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("roommate_listings")
      .select("id, user_id, listing_type, title, description, address, area_label, lat, lng, move_in_from, rent_cents, contact_email, people_count")
      .order("created_at", { ascending: false }),
    supabase.from("person_profiles").select("id, user_id, name, location_label, budget_label, move_in_from, move_in, note, preferences").order("created_at", { ascending: false }),
  ]);

  const profile = profileRes.data ?? null;
  const prefs = prefsRes.data;
  const listings = (listingsRes.data ?? []).filter((row) => row.user_id !== user.id);
  const personProfiles = (personProfilesRes.data ?? []).filter((row: { user_id?: string }) => row.user_id !== user.id);
  const personProfilesList = personProfiles.length > 0 ? personProfiles : (personProfilesRes.data ?? []);

  const seekerName = profile?.full_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? "The user";
  const moveIn = prefs?.move_in_from ?? new Date().toISOString().slice(0, 10);
  const maxRentCents = prefs?.max_rent_cents ?? null;
  const notes = prefs?.notes ?? null;

  const listingCandidates = listings.map((row) => {
    const rent = row.rent_cents != null ? `$${Math.round(row.rent_cents / 100)}/mo` : "not specified";
    return [
      `id: ${row.id}`,
      `title: ${(row.title ?? "").trim() || "No title"}`,
      `description: ${(row.description ?? "").slice(0, 300)}`,
      `address/area: ${[row.address, row.area_label].filter(Boolean).join(" · ") || "Not specified"}`,
      `rent: ${rent}`,
      `move-in: ${row.move_in_from ?? "flexible"}`,
      `looking for: ${row.people_count != null ? `${row.people_count} roommate(s)` : "roommates"}`,
      `type: ${row.listing_type ?? "roommate"}`,
    ].join("\n");
  });

  type PersonRow = { id: string; name: string | null; location_label: string | null; budget_label: string | null; move_in_from: string | null; move_in: string | null; note: string | null; preferences: string[] | null };
  const personCandidates = personProfilesList.map((row: PersonRow) => {
    const id = `pp-${row.id}`;
    return [
      `id: ${id}`,
      `title: ${(row.name ?? "").trim() || "Looking for roommate"}`,
      `description: ${(row.note ?? "").slice(0, 300)}`,
      `address/area: ${row.location_label ?? "Not specified"}`,
      `rent: ${row.budget_label ?? "not specified"}`,
      `move-in: ${row.move_in_from ?? row.move_in ?? "flexible"}`,
      `preferences: ${Array.isArray(row.preferences) ? row.preferences.join(", ") : "none"}`,
      `type: profile`,
    ].join("\n");
  });

  const personDisplayByKey = new Map<string, { title: string; areaLabel: string; rent?: number; moveInDate: string }>();
  personProfilesList.forEach((row: PersonRow) => {
    const key = `pp-${row.id}`;
    const rentNum = row.budget_label?.match(/\$?\s*(\d+)/)?.[1];
    personDisplayByKey.set(key, {
      title: (row.name ?? "").trim() || "Looking for roommate",
      areaLabel: row.location_label ?? "",
      rent: rentNum != null ? Number(rentNum) : undefined,
      moveInDate: row.move_in_from ?? row.move_in ?? "",
    });
  });

  const candidatesText = [...listingCandidates, ...personCandidates].join("\n\n---\n\n");

  if (!candidatesText.trim()) {
    return NextResponse.json({
      rankings: [] as Ranking[],
      message: "No other roommates have added listings yet. When they do, we'll rank your best matches here.",
    });
  }

  const prompt = `You are a roommate-matching assistant. Rank the following candidates from BEST to WORST match for the seeker. Consider location, budget, move-in timing, and any preferences.

SEEKER (the person looking for a roommate):
- Name: ${seekerName}
- Preferred move-in: ${moveIn}
- Max budget: ${maxRentCents != null ? `$${Math.round(maxRentCents / 100)}/mo` : "not specified"}
- Notes/preferences: ${notes ?? "none"}

CANDIDATES (each block is one listing; use the exact "id" in your response):
${candidatesText}

Return a JSON object with a single key "rankings", which is an array of objects. Each object must have:
- "id": the exact candidate id (as shown in the candidates, e.g. a UUID or pp-<uuid>)
- "rank": number from 1 (best) to N (worst)
- "reason": one short sentence explaining why this rank (mention location, budget, or fit)

Use only the ids that appear in the candidates above. Order by best match first. Output nothing but the JSON object.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[ai-insights] Gemini error", res.status, errText);
      const message = res.status === 401 ? "Invalid Gemini API key." : res.status === 429 ? "AI rate limit. Try again shortly." : "AI request failed.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    let parsed: { rankings?: Ranking[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("[ai-insights] Invalid JSON from Gemini", text.slice(0, 200));
      return NextResponse.json({ error: "Invalid AI response" }, { status: 502 });
    }

    const rankings: Ranking[] = Array.isArray(parsed.rankings)
      ? parsed.rankings.filter(
          (r): r is Ranking =>
            typeof r?.id === "string" &&
            typeof r?.rank === "number" &&
            typeof r?.reason === "string"
        )
      : [];

    const listingIdSet = new Set(listings.map((r) => r.id));
    const personIdSet = new Set(personProfilesList.map((r: { id: string }) => `pp-${r.id}`));
    const validRankings = rankings
      .filter((r) => listingIdSet.has(r.id) || personIdSet.has(r.id))
      .sort((a, b) => a.rank - b.rank)
      .map((r) => {
        const display = personDisplayByKey.get(r.id);
        if (display) return { ...r, title: display.title, areaLabel: display.areaLabel, rent: display.rent, moveInDate: display.moveInDate };
        return r;
      });

    return NextResponse.json({
      rankings: validRankings,
    });
  } catch (err) {
    console.error("[ai-insights]", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
