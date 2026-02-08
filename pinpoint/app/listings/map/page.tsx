"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ListingDetailPanel } from "@/components/ListingDetailPanel";
import { QUEENS_CAMPUS } from "@/lib/seed-data";
import type { Pin } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-100 dark:bg-zinc-950 text-zinc-500 text-sm">Loading map...</div>
  ),
});

export default function ListingsMapPage() {
  const [listings, setListings] = useState<Pin[]>([]);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const handleGeocode = useCallback(() => {
    setGeocoding(true);
    fetch("/api/listings/geocode", { method: "POST" })
      .then((r) => r.json())
      .then(() => {
        return fetch("/api/listings").then((r) => r.json());
      })
      .then((data: Pin[]) => setListings(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setGeocoding(false));
  }, []);

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data: Pin[]) => setListings(Array.isArray(data) ? data : []))
      .catch(() => setListings([]));
  }, []);

  const handlePinClick = useCallback((pin: Pin) => setSelectedPin(pin), []);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" data-theme="app">
      <div className="fixed top-4 left-20 z-30 flex items-center gap-2">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm px-4 py-2">
          <span className="text-sm font-medium text-zinc-950 dark:text-white">Listings map</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Rooms & places only</p>
        </div>
        <button
          type="button"
          onClick={handleGeocode}
          disabled={geocoding || listings.length === 0}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          {geocoding ? "Geocoding…" : "Fix pin locations"}
        </button>
      </div>
      <div className="fixed top-4 right-4 z-30 flex gap-2">
        <Link href="/listings" className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          ← List view
        </Link>
        <Link href="/roommates" className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Roommates map →
        </Link>
      </div>
      <div className="pl-16 pr-0 pt-16 pb-0">
        <div className="h-[calc(100vh-4rem)] w-full">
          <MapView
            pins={listings}
            onPinClick={handlePinClick}
            selectedPinId={selectedPin?.id}
            onMapClick={() => setSelectedPin(null)}
            initialCenter={QUEENS_CAMPUS}
            fitBoundsToPins
            uniformPinColor
          />
        </div>
      </div>
      {selectedPin && <ListingDetailPanel pin={selectedPin} onClose={() => setSelectedPin(null)} />}
      <div className="fixed bottom-4 left-20 z-30 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 shadow-sm">
        {listings.length} listing{listings.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
