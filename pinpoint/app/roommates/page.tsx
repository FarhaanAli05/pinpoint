"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getRoommatePins, MOCK_ROOMMATES } from "@/lib/mock-roommates";
import type { Pin } from "@/lib/types";
import { RoommateMapLegend } from "@/components/RoommateMapLegend";
import { AddUserPinModal } from "@/components/AddUserPinModal";
import { AIInsightsSidebar, type AIRanking } from "@/components/AIInsightsSidebar";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-100 dark:bg-zinc-950 text-zinc-500 text-sm">Loading map...</div>
  ),
});

const ROOMMATES_CATEGORIES = ["looking-for-roommates", "looking-for-room-and-roommate", "have-room-need-roommates", "sublet-room"];

/** Shorten long geocoded address (e.g. "Kingston, Eastern Ontario, Ontario, K7L 2Z3, Canada" → "Kingston") */
function shortLocation(address: string | undefined): string {
  if (!address?.trim()) return "";
  const s = address.trim();
  if (s.length <= 30) return s;
  const first = s.split(",")[0]?.trim();
  return first || s.slice(0, 30);
}

export default function RoommatesMapPage() {
  const [mounted, setMounted] = useState(false);
  const [roommateListings, setRoommateListings] = useState<Pin[]>([]);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addPinCoords, setAddPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pinFormDefaults, setPinFormDefaults] = useState<{ name?: string; email?: string; budget?: string; move_in_from?: string; notes?: string } | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [addPinError, setAddPinError] = useState<string | null>(null);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [aiInsightsRankings, setAiInsightsRankings] = useState<AIRanking[]>([]);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);
  const [aiInsightsHasSearched, setAiInsightsHasSearched] = useState(false);
  const mapInstanceRef = useRef<{ zoomIn: () => void; zoomOut: () => void } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    fetch("/api/roommate-listings", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Pin[]) => { if (!cancelled) setRoommateListings(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setRoommateListings([]); });
    return () => { cancelled = true; };
  }, [mounted]);

  const pins = useMemo(() => {
    if (!mounted) {
      return MOCK_ROOMMATES.filter((p) => ROOMMATES_CATEGORIES.includes(p.category));
    }
    const ids = new Set(roommateListings.map((p) => p.id));
    const mock = getRoommatePins().filter((p) => !ids.has(p.id));
    const combined = [...roommateListings, ...mock];
    return combined.filter((p) => ROOMMATES_CATEGORIES.includes(p.category) || p.isMe);
  }, [mounted, roommateListings]);

  const handlePinClick = useCallback((pin: Pin) => {
    setSelectedPin(pin);
  }, []);

  const handleMapDoubleClick = useCallback((lat: number, lng: number) => {
    setAddPinError(null);
    setAddPinCoords({ lat, lng });
    fetch("/api/me/profile", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((d: { profile?: { full_name?: string; email?: string }; preferences?: { move_in_from?: string; max_rent_cents?: number | null; notes?: string | null } } | null) => {
        if (!d?.profile && !d?.preferences) return;
        setPinFormDefaults({
          name: d.profile?.full_name ?? "",
          email: d.profile?.email ?? "",
          budget: d.preferences?.max_rent_cents != null ? String(Math.round(d.preferences.max_rent_cents / 100)) : "",
          move_in_from: d.preferences?.move_in_from ?? "",
          notes: d.preferences?.notes ?? "",
        });
      })
      .catch(() => setPinFormDefaults(null));
  }, []);

  const isDbPinId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const handleDeletePin = useCallback(async (pin: Pin) => {
    if (!pin.isMe || !pin.id || !isDbPinId(pin.id)) return;
    try {
      const res = await fetch(`/api/roommate-listings/${encodeURIComponent(pin.id)}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setSelectedPin(null);
        setRoommateListings((prev) => prev.filter((p) => p.id !== pin.id));
        setDeleteMessage("Pin deleted");
        setTimeout(() => setDeleteMessage(null), 3000);
        // Refetch with no cache so we get the updated list from the server
        fetch("/api/roommate-listings", { cache: "no-store", credentials: "include" })
          .then((r) => (r.ok ? r.json() : []))
          .then((list: Pin[]) => setRoommateListings(Array.isArray(list) ? list : []))
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAddPinSubmit = useCallback(async (pin: Pin) => {
    const pinType = pin.title.toLowerCase().includes("roommate") ? "need-roommates" : "need-room";
    const category = pinType === "need-roommates" ? "looking-for-roommates" : "looking-for-room-and-roommate";
    setAddPinError(null);
    try {
      const res = await fetch("/api/roommate-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: pin.lat,
          lng: pin.lng,
          category,
          title: pin.title,
          description: pin.description,
          contactEmail: pin.contactEmail,
          address: pin.address,
          areaLabel: pin.areaLabel,
          moveInDate: pin.moveInDate,
          rent: pin.rent,
          peopleCount: pin.peopleCount,
        }),
      });
      if (res.status === 401) {
        setAddPinError("Sign in to add a pin.");
        return;
      }
      if (res.ok) {
        const created = await res.json();
        setRoommateListings((prev) => [created, ...prev]);
        setAddPinCoords(null);
      }
    } catch {
      // ignore
    }
  }, []);

  const pinsById = useMemo(() => new Map(pins.map((p) => [p.id, p])), [pins]);

  const handleOpenAiInsights = useCallback(() => {
    setShowAiInsights(true);
    setAiInsightsError(null);
  }, []);

  const handleAiSearch = useCallback((query: string) => {
    setAiInsightsError(null);
    setAiInsightsRankings([]);
    setAiInsightsHasSearched(true);
    setAiInsightsLoading(true);
    fetch("/api/roommate-listings/ai-insights", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({})) as { rankings?: AIRanking[]; error?: string };
        if (!res.ok) {
          setAiInsightsError(res.status === 401 ? "Sign in to use AI match." : (data.error || "Could not load AI insights"));
          setAiInsightsRankings([]);
          return;
        }
        if (data.error) {
          setAiInsightsError(data.error);
          setAiInsightsRankings([]);
        } else {
          setAiInsightsRankings(Array.isArray(data.rankings) ? data.rankings : []);
          setAiInsightsError(null);
        }
      })
      .catch(() => setAiInsightsError("Could not load AI insights"))
      .finally(() => setAiInsightsLoading(false));
  }, []);

  const countByCategory = {
    "looking-for-room-and-roommate":
      pins.filter((p) => p.category === "looking-for-room-and-roommate" || p.category === "looking-for-roommates").length,
    "have-room-need-roommates": pins.filter((p) => p.category === "have-room-need-roommates").length,
    "sublet-room": pins.filter((p) => p.category === "sublet-room").length,
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" data-theme="app">
      {/* Top bar: compact */}
      {deleteMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium shadow-lg animate-in fade-in duration-200">
          {deleteMessage}
        </div>
      )}
      <div className="fixed top-4 z-30 left-20 flex items-center gap-2">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-sm px-4 py-2">
          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">Roommates</span>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Double-click map to add yourself</p>
        </div>
        <button
          type="button"
          onClick={() => setShowSuggestions((s) => !s)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors shadow-sm ${showSuggestions ? "bg-zinc-700 dark:bg-zinc-600 text-white" : "bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900"}`}
        >
          Matches
        </button>
        <button
          type="button"
          onClick={handleOpenAiInsights}
          className="rounded-md px-3 py-1.5 text-sm font-medium bg-amber-500 dark:bg-amber-600 text-white hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors shadow-sm"
        >
          AI insights
        </button>
      </div>
      <div className="fixed top-4 right-14 z-30 flex items-center gap-2">
        <Link
          href="/listings/map"
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 shadow-sm inline-flex items-center gap-1.5 transition-colors"
          title="Back to rooms & places map"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to listings
        </Link>
      </div>
      {/* Custom zoom controls positioned below the Roommates bar */}
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
      <RoommateMapLegend />

      {/* AI insights sidebar: right side */}
      {showAiInsights && (
        <div className="fixed right-0 top-0 bottom-0 z-40">
          <AIInsightsSidebar
            onClose={() => setShowAiInsights(false)}
            rankings={aiInsightsRankings}
            pinsById={pinsById}
            onSelectPin={(pin) => { setSelectedPin(pin); }}
            onSearch={handleAiSearch}
            hasSearched={aiInsightsHasSearched}
            loading={aiInsightsLoading}
            error={aiInsightsError}
          />
        </div>
      )}

      {/* Nearby roommates: show real pins from the map */}
      {showSuggestions && (
        <div className="fixed top-20 z-30 left-20 w-64 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nearby roommates</p>
            <button type="button" onClick={() => setShowSuggestions(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-sm" aria-label="Close">×</button>
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {pins.filter((p) => !p.isMe).length === 0 ? (
              <li className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400">No roommate listings yet.</li>
            ) : (
              pins.filter((p) => !p.isMe).slice(0, 8).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => { setSelectedPin(p); setShowSuggestions(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                  >
                    <span className="font-medium">{p.ownerName || p.title}</span>
                    {p.rent != null && p.rent > 0 && <span className="text-zinc-500"> · ${p.rent}/mo</span>}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      <div className={`pl-16 transition-[padding] duration-200 ${showAiInsights ? "pr-72" : "pr-0"}`}>
        <div className="h-screen w-full">
          <MapView
            pins={pins}
            onPinClick={handlePinClick}
            selectedPinId={selectedPin?.id}
            onMapDoubleClick={handleMapDoubleClick}
            onMapReady={(controls) => {
              mapInstanceRef.current = controls;
            }}
          />
        </div>
      </div>

      {selectedPin && (
        <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl flex flex-col">
          <div className="p-4 pb-2 shrink-0 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-start gap-3">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white leading-tight">
                {selectedPin.ownerName
                  ? `${selectedPin.ownerName}: ${selectedPin.title || "Listing"}`
                  : selectedPin.title || "Roommate listing"}
              </h2>
              <button
                onClick={() => setSelectedPin(null)}
                className="shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pt-3 space-y-4">
            {selectedPin.description && selectedPin.description.trim() && !/^email\s+to\s+connect\.?$/i.test(selectedPin.description.trim()) && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedPin.description}</p>
            )}
            <p className="text-sm text-zinc-500">
              From: {selectedPin.moveInDate}
              {(selectedPin.areaLabel?.trim() || shortLocation(selectedPin.address)) && (
                <> · {selectedPin.areaLabel?.trim() || shortLocation(selectedPin.address)}</>
              )}
              {selectedPin.rent != null && selectedPin.rent > 0 && (
                <> · ${selectedPin.rent}/mo</>
              )}
            </p>
            {selectedPin.peopleCount != null && selectedPin.peopleCount > 0 && (
              <p className="text-sm text-zinc-500">Looking for {selectedPin.peopleCount} roommate{selectedPin.peopleCount !== 1 ? "s" : ""}</p>
            )}
            <div className="flex flex-col gap-3 pt-2">
              {selectedPin.contactEmail && (
                <a
                  href={`mailto:${selectedPin.contactEmail}`}
                  className="inline-block text-center rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Email to connect
                </a>
              )}
              {selectedPin.isMe && isDbPinId(selectedPin.id) && (
                <button
                  type="button"
                  onClick={() => handleDeletePin(selectedPin)}
                  className="w-full py-2.5 px-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                >
                  Delete this pin
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {addPinCoords && (
        <AddUserPinModal
          lat={addPinCoords.lat}
          lng={addPinCoords.lng}
          onClose={() => { setAddPinCoords(null); setPinFormDefaults(null); setAddPinError(null); }}
          onSubmit={handleAddPinSubmit}
          error={addPinError}
          initialValues={pinFormDefaults ?? undefined}
        />
      )}

      <div className="fixed bottom-3 left-20 z-30 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 shadow-sm">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">{pins.length}</span> people
        <span className="mx-1.5 text-zinc-400">·</span>
        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />{countByCategory["looking-for-room-and-roommate"]}</span>
        <span className="inline-flex items-center gap-1 ml-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{countByCategory["have-room-need-roommates"]}</span>
        <span className="inline-flex items-center gap-1 ml-1.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-500" />{countByCategory["sublet-room"]}</span>
      </div>
    </div>
  );
}
