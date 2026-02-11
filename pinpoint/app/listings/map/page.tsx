"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ListingDetailPanel } from "@/components/ListingDetailPanel";
import { ListingsAISearchSidebar } from "@/components/ListingsAISearchSidebar";
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
  const [showAiSearch, setShowAiSearch] = useState(false);
  const [aiResultIds, setAiResultIds] = useState<string[] | null>(null);
  const mapInstanceRef = useRef<{ zoomIn: () => void; zoomOut: () => void } | null>(null);

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data: Pin[]) => setListings(Array.isArray(data) ? data : []))
      .catch(() => setListings([]));
  }, []);

  const handlePinClick = useCallback((pin: Pin) => setSelectedPin(pin), []);

  const pinsToShow = useMemo(() => {
    if (aiResultIds === null) return listings;
    return listings.filter((p) => aiResultIds.includes(p.id));
  }, [listings, aiResultIds]);

  const rightPadding = showAiSearch ? "pr-[min(28rem,100vw)]" : "pr-0";

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" data-theme="app">
      <div className="fixed top-4 left-20 z-30 flex items-center gap-2">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-sm px-4 py-2">
          <span className="text-sm font-medium text-zinc-950 dark:text-white">Listings map</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Rooms & places only</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAiSearch((v) => !v)}
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 transition-colors shadow-sm"
          aria-expanded={showAiSearch}
          aria-controls="ai-search-sidebar"
        >
          AI search
        </button>
      </div>
      {/* Custom zoom controls positioned below the Listings map bar */}
      <div className="fixed top-20 left-20 z-30 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 transition-colors shadow-sm flex items-center justify-center"
          aria-label="Zoom in"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 transition-colors shadow-sm flex items-center justify-center"
          aria-label="Zoom out"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
      <div className="fixed top-4 right-14 z-30">
        <Link href="/roommates" className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 inline-block shadow-sm transition-colors">
          Roommates map →
        </Link>
      </div>
      <div className={`pl-16 ${rightPadding} transition-[padding] duration-200`}>
        <div className="h-screen w-full">
          <MapView
            pins={pinsToShow}
            onPinClick={handlePinClick}
            selectedPinId={selectedPin?.id}
            onMapClick={() => setSelectedPin(null)}
            initialCenter={QUEENS_CAMPUS}
            fitBoundsToPins
            uniformPinColor
            onMapReady={(controls) => {
              mapInstanceRef.current = controls;
            }}
          />
        </div>
      </div>
      {showAiSearch && (
        <div id="ai-search-sidebar">
          <ListingsAISearchSidebar
            listings={listings}
            onSelectPin={(pin) => { setSelectedPin(pin); }}
            onClose={() => setShowAiSearch(false)}
            resultIds={aiResultIds}
            onResults={setAiResultIds}
            onClearResults={() => setAiResultIds(null)}
          />
        </div>
      )}
      {selectedPin && <ListingDetailPanel pin={selectedPin} onClose={() => setSelectedPin(null)} />}
      <div className="fixed bottom-4 left-20 z-30 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 shadow-sm">
        {aiResultIds === null
          ? `${listings.length} listing${listings.length !== 1 ? "s" : ""}`
          : `${pinsToShow.length} result${pinsToShow.length !== 1 ? "s" : ""}`}
      </div>
    </div>
  );
}
