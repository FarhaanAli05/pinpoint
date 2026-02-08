import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAreaForAddress, getBoundaryForPoint } from "@/lib/kingston-areas";
import type { Pin, ListingCategory } from "@/lib/types";
import path from "path";
import fs from "fs";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface PropertyListingJson {
  id: string;
  lat: number;
  lng: number;
  rent: number;
  moveInDate: string;
  type: "whole-unit" | "room";
  title: string;
  description?: string;
  address: string;
  postalCode?: string;
  bedrooms: number;
  features?: string[];
  externalLink?: string;
  images?: string[];
  sourceType?: string;
  sourceLabel?: string;
  createdAt?: number;
}

function isValidCoord(n: unknown): n is number {
  return typeof n === "number" && !Number.isNaN(n) && n >= -90 && n <= 90;
}
function isValidLng(n: unknown): n is number {
  return typeof n === "number" && !Number.isNaN(n) && n >= -180 && n <= 180;
}

function jsonToPin(d: PropertyListingJson): Pin | null {
  const address = d.address ?? "";
  const area = getAreaForAddress(address);
  const useRawCoords = isValidCoord(d.lat) && isValidLng(d.lng);
  const lat = useRawCoords ? d.lat : area.center.lat;
  const lng = useRawCoords ? d.lng : area.center.lng;
  const boundary = useRawCoords ? getBoundaryForPoint(lat, lng) : area.boundary;
  const category: ListingCategory =
    d.type === "whole-unit" ? "share-listing" : "sublet-room";
  return {
    id: d.id,
    lat,
    lng,
    boundary,
    rent: d.rent ?? 0,
    moveInDate: d.moveInDate ?? "2025-09-01",
    type: d.type,
    category,
    title: d.title ?? "",
    description: d.description ?? "",
    address,
    postalCode: d.postalCode,
    bedrooms: d.bedrooms ?? 1,
    features: Array.isArray(d.features) ? d.features : [],
    externalLink: d.externalLink,
    images: Array.isArray(d.images) ? d.images : undefined,
    sourceType: (d.sourceType as Pin["sourceType"]) ?? "seeded",
    sourceLabel: d.sourceLabel,
    createdAt: typeof d.createdAt === "number" ? d.createdAt : Date.now(),
  };
}

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

/**
 * POST /api/listings/ai-search
 * Body: { query: string }
 * Returns: { listingIds: string[] } (best matches first) or { error: string }
 * Uses Gemini to filter Supabase property_listings by natural-language query.
 */
export async function POST(request: NextRequest) {
  let query: string;
  try {
    const body = await request.json();
    query = typeof body?.query === "string" ? body.query.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  let apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) apiKey = loadGeminiKeyFromParentEnv();
  if (!apiKey) {
    console.error("[listings/ai-search] GEMINI_API_KEY not set.");
    return NextResponse.json(
      { error: "AI not configured. Add GEMINI_API_KEY to .env and restart." },
      { status: 503 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("property_listings")
    .select("id, data")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listings/ai-search] Supabase error", error.message);
    return NextResponse.json({ error: "Failed to load listings" }, { status: 502 });
  }

  const pins: Pin[] = (rows ?? [])
    .map((row) => jsonToPin(row.data as PropertyListingJson))
    .filter((p): p is Pin => p != null);

  if (pins.length === 0) {
    return NextResponse.json({ listingIds: [] });
  }

  const listingsBlock = pins
    .map(
      (p) =>
        `id: ${p.id}
title: ${p.title}
address/area: ${p.address}
postalCode: ${p.postalCode ?? "not specified"}
rent: ${p.rent > 0 ? `$${p.rent}/mo` : "not specified"}
type: ${p.type}
bedrooms: ${p.bedrooms}
features: ${(p.features ?? []).join(", ") || "none"}
description: ${(p.description ?? "").slice(0, 200)}`
    )
    .join("\n\n---\n\n");

  const prompt = `The user is searching for a place to rent in Kingston, ON. They said: "${query}"

Here are the available listings (each block is one listing; use the exact "id" in your response):

${listingsBlock}

Return a JSON object with a single key "ids" whose value is an array of listing IDs that match the user's request. Put the best matches first. Only include IDs that reasonably match. If none match, return {"ids": []}. Use only the exact ids shown above. Output nothing but the JSON object.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[listings/ai-search] Gemini error", res.status, errText);
      const message =
        res.status === 401
          ? "Invalid Gemini API key."
          : res.status === 429
            ? "Rate limit. Try again shortly."
            : "AI request failed.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = await res.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    // Strip markdown code blocks if present (e.g. ```json ... ```)
    const codeBlock = text.match(/^```(?:json)?\s*([\s\S]*?)```$/);
    if (codeBlock) text = codeBlock[1].trim();
    else if (text.startsWith("```")) text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();

    let ids: string[] = [];
    try {
      const parsed = JSON.parse(text) as { ids?: unknown };
      ids = Array.isArray(parsed.ids)
        ? parsed.ids.filter((id): id is string => typeof id === "string")
        : [];
    } catch {
      // Fallback: extract pin IDs from response (handles truncated or malformed JSON)
      const pinIdMatches = text.match(/"pin-\d+"/g);
      if (pinIdMatches) {
        ids = pinIdMatches.map((m) => m.replace(/"/g, ""));
      } else {
        console.error("[listings/ai-search] Invalid JSON from Gemini", text.slice(0, 300));
        return NextResponse.json({ error: "Invalid AI response" }, { status: 502 });
      }
    }
    const idSet = new Set(pins.map((p) => p.id));
    const listingIds = ids.filter((id) => idSet.has(id));

    return NextResponse.json({ listingIds });
  } catch (err) {
    console.error("[listings/ai-search]", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
