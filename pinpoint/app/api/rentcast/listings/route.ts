import { NextRequest, NextResponse } from "next/server";
import type { Pin } from "@/lib/types";

const RENTCAST_API_URL = "https://api.rentcast.io/v1/listings/rental/long-term";

/** RentCast API response item (fields may vary; we map defensively) */
interface RentCastListing {
  id?: string;
  address?: string;
  formattedAddress?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price?: number;
  monthlyRent?: number;
  rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  propertyType?: string;
  description?: string;
  url?: string | null;
  link?: string | null;
  listingUrl?: string | null;
  href?: string | null;
  [key: string]: unknown;
}

function toPin(item: RentCastListing, index: number): Pin | null {
  const id = item.id ?? `rentcast-${index}-${Date.now()}`;
  const rent = item.price ?? item.monthlyRent ?? item.rent ?? 0;
  const lat = item.latitude ?? item.lat;
  const lng = item.longitude ?? item.lng;
  const addressRaw =
    item.formattedAddress ??
    item.address ??
    item.streetAddress ??
    [item.address, item.city, item.state, item.zipCode].filter(Boolean).join(", ");
  const address = addressRaw ? addressRaw : "Address not provided";
  if (lat == null || lng == null) return null;
  const bedrooms = item.bedrooms ?? 1;
  const title =
    (bedrooms > 1 ? `${bedrooms}BR ` : "Room ") +
    (address.split(",")[0]?.trim() || "Rental");
  const externalLink =
    item.url ?? item.link ?? item.listingUrl ?? item.href ?? undefined;
  return {
    id: `rentcast-${String(id).replace(/\s/g, "-")}`,
    lat: Number(lat),
    lng: Number(lng),
    rent: Number(rent),
    moveInDate: new Date().toISOString().slice(0, 10),
    type: bedrooms === 1 ? "room" : "whole-unit",
    category: "sublet",
    title,
    description: item.description ?? `Rental listing — ${address}. Contact via listing source.`,
    address,
    bedrooms,
    features: [],
    externalLink: externalLink ? String(externalLink) : undefined,
    sourceType: "rentcast",
    sourceLabel: "RentCast",
    createdAt: Date.now(),
  };
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RentCast API key not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  // ---------- FILTER: read query params (add more here as needed) ----------
  const city = searchParams.get("city") ?? "Kingston";
  const state = searchParams.get("state") ?? "ON";
  const zipCode = searchParams.get("zipCode") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const minBedrooms = searchParams.get("minBedrooms") ?? "";
  const maxBedrooms = searchParams.get("maxBedrooms") ?? "";

  // ---------- FILTER: pass to RentCast API (only params their API supports) ----------
  const url = new URL(RENTCAST_API_URL);
  url.searchParams.set("city", city);
  url.searchParams.set("state", state);
  if (zipCode) url.searchParams.set("zipCode", zipCode);
  if (minPrice) url.searchParams.set("minPrice", minPrice);
  if (maxPrice) url.searchParams.set("maxPrice", maxPrice);

  try {
    let res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-Api-Key": apiKey,
      },
      next: { revalidate: 300 },
    });

    let text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      console.error("RentCast API non-JSON response", res.status, text.slice(0, 200));
      return NextResponse.json([]);
    }

    if (!res.ok) {
      console.error("RentCast API error", res.status, text.slice(0, 300));
      return NextResponse.json([]);
    }

    let items = Array.isArray(data) ? data : (data as { listings?: unknown[] })?.listings ?? (data as { data?: unknown[] })?.data ?? [];
    if (items.length === 0 && city.toLowerCase() === "kingston" && state === "ON") {
      url.searchParams.set("state", "NY");
      res = await fetch(url.toString(), {
        headers: { Accept: "application/json", "X-Api-Key": apiKey! },
        next: { revalidate: 300 },
      });
      text = await res.text();
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        return NextResponse.json([]);
      }
      if (res.ok) {
        items = Array.isArray(data) ? data : (data as { listings?: unknown[] })?.listings ?? (data as { data?: unknown[] })?.data ?? [];
      }
    }
    let pins: Pin[] = items
      .map((item: RentCastListing, i: number) => toPin(item, i))
      .filter((p): p is Pin => p != null);

    // ---------- FILTER: after API response (when RentCast doesn't support the param) ----------
    const minP = minPrice ? Number(minPrice) : NaN;
    const maxP = maxPrice ? Number(maxPrice) : NaN;
    const minB = minBedrooms ? Number(minBedrooms) : NaN;
    const maxB = maxBedrooms ? Number(maxBedrooms) : NaN;
    if (!Number.isNaN(minP)) pins = pins.filter((p) => p.rent >= minP);
    if (!Number.isNaN(maxP)) pins = pins.filter((p) => p.rent <= maxP);
    if (!Number.isNaN(minB)) pins = pins.filter((p) => p.bedrooms >= minB);
    if (!Number.isNaN(maxB)) pins = pins.filter((p) => p.bedrooms <= maxB);

    return NextResponse.json(pins);
  } catch (e) {
    console.error("RentCast fetch error", e);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
