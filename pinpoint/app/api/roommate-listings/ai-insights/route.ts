import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import path from "path";
import fs from "fs";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export type MatchLevel = "recommended" | "likely" | "less_likely";

type Ranking = {
  id: string;
  rank: number;
  reason: string;
  matchLevel?: MatchLevel;
  title?: string;
  areaLabel?: string;
  rent?: number;
  moveInDate?: string;
};

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

const VALID_MATCH_LEVELS: MatchLevel[] = ["recommended", "likely", "less_likely"];

function normalizeMatchLevel(s: unknown): MatchLevel {
  if (typeof s === "string" && VALID_MATCH_LEVELS.includes(s as MatchLevel)) return s as MatchLevel;
  return "likely";
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { query?: string } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    // optional body
  }
  const userQuery = typeof body?.query === "string" ? body.query.trim() : "";

  let apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) apiKey = loadGeminiKeyFromParentEnv();
  if (!apiKey) {
    console.error("[ai-insights] GEMINI_API_KEY not set. Check .env in app root or parent folder.");
    return NextResponse.json(
      { error: "AI not configured. Add GEMINI_API_KEY to .env in the app folder (or parent folder) and restart." },
      { status: 503 }
    );
  }

  // Current user profile (for context). Candidates: all roommate_listings from Supabase (so user's 21 records are searched).
  const [profileRes, prefsRes, listingsRes] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase.from("user_preferences").select("move_in_from, max_rent_cents, notes").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("roommate_listings")
      .select("id, user_id, listing_type, title, description, address, area_label, lat, lng, move_in_from, rent_cents, contact_email, people_count")
      .order("created_at", { ascending: false }),
  ]);

  const profile = profileRes.data ?? null;
  const prefs = prefsRes.data;
  const listings = listingsRes.data ?? [];

  const seekerName = profile?.full_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? "The user";
  const moveIn = prefs?.move_in_from ?? new Date().toISOString().slice(0, 10);
  const maxRentCents = prefs?.max_rent_cents ?? null;
  const notes = prefs?.notes ?? null;

  const listingDisplayByKey = new Map<string, { title: string; areaLabel: string; rent?: number; moveInDate: string }>();
  const listingCandidates = listings.map((row: { id: string; title: string | null; description: string | null; address: string | null; area_label: string | null; rent_cents: number | null; move_in_from: string | null; people_count: number | null; listing_type: string | null }) => {
    const rent = row.rent_cents != null ? `$${Math.round(row.rent_cents / 100)}/mo` : "not specified";
    listingDisplayByKey.set(row.id, {
      title: (row.title ?? "").trim() || "No title",
      areaLabel: [row.address, row.area_label].filter(Boolean).join(" · ") || "",
      rent: row.rent_cents != null ? Math.round(row.rent_cents / 100) : undefined,
      moveInDate: row.move_in_from ?? "",
    });
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

  const candidatesText = listingCandidates.join("\n\n---\n\n");

  if (!candidatesText.trim()) {
    return NextResponse.json({
      rankings: [] as Ranking[],
      message: "No roommate listings in the database yet. Add listings on the map or run the seed to populate roommate_listings.",
    });
  }

  const userDescription = userQuery
    ? `What they want: "${userQuery}"`
    : `Profile: name ${seekerName}, move-in ${moveIn}, max budget ${maxRentCents != null ? `$${Math.round(maxRentCents / 100)}/mo` : "not specified"}, notes: ${notes ?? "none"}`;

  const prompt = `You are a roommate-matching assistant. Match the following roommate listings to what the user is looking for. For each listing, assign a match level:
- "recommended": strong match (fits what they want: location, budget, move-in, lifestyle)
- "likely": good match (most criteria align)
- "less_likely": weaker match (some mismatch but still possible)

USER (what they're looking for / their profile):
${userDescription}

CANDIDATES (roommate_listings from database; use the exact "id" in your response):
${candidatesText}

Return a JSON object with a single key "rankings", an array of objects. Each object must have:
- "id": the exact listing id (UUID as shown above)
- "rank": number from 1 (best) to N (worst)
- "reason": one short sentence explaining the match (location, budget, or fit)
- "matchLevel": one of "recommended", "likely", "less_likely"

Use only the ids that appear in the candidates. Order by best match first. Output nothing but the JSON object.`;

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
    let text = (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
    if (typeof text !== "string") text = "";
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    const listingIdSet = new Set(listings.map((r: { id: string }) => r.id));
    let parsed: { rankings?: Ranking[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      // Truncated or malformed JSON: extract complete UUIDs from "id": "..." and build partial rankings
      const uuidRe = /"id":\s*"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/gi;
      const ids: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = uuidRe.exec(text)) !== null) {
        if (listingIdSet.has(m[1])) ids.push(m[1]);
      }
      const seen = new Set<string>();
      const uniqueIds = ids.filter((id) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      parsed = {
        rankings: uniqueIds.map((id, i) => ({
          id,
          rank: i + 1,
          reason: "Match based on your preferences.",
          matchLevel: "likely" as MatchLevel,
        })),
      };
    }

    const rankings: Ranking[] = Array.isArray(parsed.rankings)
      ? parsed.rankings
          .filter(
            (r): r is Ranking =>
              typeof r?.id === "string" && typeof r?.rank === "number" && typeof r?.reason === "string" && listingIdSet.has(r.id)
          )
          .sort((a, b) => a.rank - b.rank)
          .map((r) => {
            const display = listingDisplayByKey.get(r.id);
            const matchLevel = normalizeMatchLevel(r.matchLevel);
            return {
              ...r,
              matchLevel,
              title: display?.title ?? r.title,
              areaLabel: display?.areaLabel ?? r.areaLabel,
              rent: display?.rent ?? r.rent,
              moveInDate: display?.moveInDate ?? r.moveInDate,
            };
          })
      : [];

    return NextResponse.json({
      rankings,
    });
  } catch (err) {
    console.error("[ai-insights]", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
