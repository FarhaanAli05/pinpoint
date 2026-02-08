import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureListingCoords } from "@/lib/listings-geocode";
import { getAreaForAddress, getBoundaryForPoint } from "@/lib/kingston-areas";
import type { Pin, ListingCategory } from "@/lib/types";

function normalizeCoords(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  let a = typeof lat === "number" ? lat : typeof lat === "string" ? parseFloat(lat) : NaN;
  let b = typeof lng === "number" ? lng : typeof lng === "string" ? parseFloat(lng) : NaN;
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  if (a < -90 || a > 90 || b < -180 || b > 180) return null;
  if (a < 0 && b > 0 && a > -90) {
    [a, b] = [b, a];
  }
  return { lat: a, lng: b };
}

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

/**
 * Return property listings from Supabase (Kijiji etc). Falls back to empty array if table missing or empty.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("property_listings")
      .select("id, data")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[listings GET]", error.message);
      return NextResponse.json([], {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    const pins: Pin[] = (data ?? [])
      .map((row) => jsonToPin(row.data as PropertyListingJson))
      .filter((p): p is Pin => p != null);
    return NextResponse.json(pins, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[listings GET]", err);
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}

/**
 * POST: Ingest listing(s) from AI, scraper, or any source.
 * Geocodes address to place pins correctly. Body: single object or array of listing data.
 */
export async function POST(request: NextRequest) {
  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY required for ingest" },
      { status: 500 }
    );
  }

  let body: Record<string, unknown> | Record<string, unknown>[];
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = Array.isArray(body) ? body : [body];
  const inserted: string[] = [];
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (const raw of items) {
    const data = raw as Record<string, unknown>;
    const id = (data.id as string) || `listing-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const withCoords = await ensureListingCoords(data);

    const payload = {
      id,
      data: {
        ...data,
        id,
        lat: withCoords.lat,
        lng: withCoords.lng,
      },
    };

    const { error } = await supabase
      .from("property_listings")
      .upsert(payload, { onConflict: "id" });

    if (!error) inserted.push(id);
    await sleep(1100);
  }

  return NextResponse.json({ ok: true, inserted: inserted.length, ids: inserted });
}
