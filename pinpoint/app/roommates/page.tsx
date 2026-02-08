"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getRoommatePins, MOCK_ROOMMATES } from "@/lib/mock-roommates";
import type { Pin } from "@/lib/types";
import type { StudentProfile } from "@/lib/student-profiles";
import { STUDENT_PROFILES } from "@/lib/student-profiles";
import { StudentProfileDetailPanel } from "@/components/StudentProfileDetailPanel";
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

export default function RoommatesMapPage() {
  const [mounted, setMounted] = useState(false);
  const [roommateListings, setRoommateListings] = useState<Pin[]>([]);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addPinCoords, setAddPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pinFormDefaults, setPinFormDefaults] = useState<{ name?: string; email?: string; budget?: string; move_in_from?: string; notes?: string } | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [aiInsightsRankings, setAiInsightsRankings] = useState<AIRanking[]>([]);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);

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
    setSelectedProfile(null);
  }, []);

  const handleMapDoubleClick = useCallback((lat: number, lng: number) => {
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
      if (res.ok) {
        const created = await res.json();
        setRoommateListings((prev) => [created, ...prev]);
      }
    } catch {
      // ignore
    }
    setAddPinCoords(null);
  }, []);

  const pinsById = useMemo(() => new Map(pins.map((p) => [p.id, p])), [pins]);

  const handleOpenAiInsights = useCallback(() => {
    setShowAiInsights(true);
    setAiInsightsError(null);
    setAiInsightsRankings([]);
    setAiInsightsLoading(true);
    fetch("/api/roommate-listings/ai-insights", { method: "POST", credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({})) as { rankings?: AIRanking[]; error?: string };
        if (!res.ok) {
          setAiInsightsError(data.error || "Could not load AI insights");
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
      <div className={`fixed top-4 z-30 flex items-center gap-2 transition-[left] duration-200 ${showAiInsights ? "left-[22rem]" : "left-20"}`}>
        <span className="text-sm font-medium text-amber-900 dark:text-amber-100">Roommates</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Double-click map to add yourself</span>
        <button
          type="button"
          onClick={() => setShowSuggestions((s) => !s)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${showSuggestions ? "bg-zinc-700 dark:bg-zinc-600 text-white" : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}
        >
          Matches
        </button>
        <button
          type="button"
          onClick={handleOpenAiInsights}
          className="rounded-md px-3 py-1.5 text-sm font-medium bg-amber-500 dark:bg-amber-600 text-white hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors"
        >
          AI insights
        </button>
      </div>
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2">
        <RoommateMapLegend />
        <Link href="/listings/map" className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm" title="View rooms & places on the map">
          Listings
        </Link>
      </div>

      {/* AI insights sidebar: ranked roommates from DB */}
      {showAiInsights && (
        <div className="fixed left-16 top-0 bottom-0 z-40">
          <AIInsightsSidebar
            onClose={() => setShowAiInsights(false)}
            rankings={aiInsightsRankings}
            pinsById={pinsById}
            onSelectPin={(pin) => { setSelectedPin(pin); setSelectedProfile(null); }}
            loading={aiInsightsLoading}
            error={aiInsightsError}
          />
        </div>
      )}

      {/* Suggested matches: only when toggled */}
      {showSuggestions && (
        <div className={`fixed top-14 z-30 w-56 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden transition-[left] duration-200 ${showAiInsights ? "left-[22rem]" : "left-20"}`}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Suggested matches</p>
            <button type="button" onClick={() => setShowSuggestions(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-sm" aria-label="Close">×</button>
          </div>
          <ul className="max-h-40 overflow-y-auto">
            {STUDENT_PROFILES.slice(0, 3).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => { setSelectedProfile(p); setSelectedPin(null); setShowSuggestions(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                >
                  {p.name} · {p.budget}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`${showAiInsights ? "pl-[calc(4rem+18rem)]" : "pl-16"} pr-0 pt-12 pb-0 transition-[padding] duration-200`}>
        <div className="h-[calc(100vh-3rem)] w-full">
          <MapView
            pins={pins}
            onPinClick={handlePinClick}
            selectedPinId={selectedPin?.id}
            onMapDoubleClick={handleMapDoubleClick}
          />
        </div>
      </div>

      {selectedPin && (
        <div className="fixed right-0 top-0 z-40 h-screen w-full max-w-md border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl p-4 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{selectedPin.title}</h2>
            <button onClick={() => setSelectedPin(null)} className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white">✕</button>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedPin.description}</p>
          <p className="text-sm text-zinc-500 mt-2">From: {selectedPin.moveInDate} · {selectedPin.areaLabel ?? selectedPin.address}</p>
          {selectedPin.peopleCount != null && (
            <p className="text-sm text-zinc-500 mt-1">Looking for {selectedPin.peopleCount} roommate{selectedPin.peopleCount !== 1 ? "s" : ""}</p>
          )}
          {selectedPin.contactEmail && (
            <a href={`mailto:${selectedPin.contactEmail}`} className="mt-4 inline-block rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium">
              Email to connect
            </a>
          )}
          {selectedPin.isMe && isDbPinId(selectedPin.id) && (
            <button
              type="button"
              onClick={() => handleDeletePin(selectedPin)}
              className="mt-4 w-full py-2.5 px-4 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
            >
              Delete this pin
            </button>
          )}
        </div>
      )}

      {selectedProfile && <StudentProfileDetailPanel profile={selectedProfile} onClose={() => setSelectedProfile(null)} />}

      {addPinCoords && (
        <AddUserPinModal
          lat={addPinCoords.lat}
          lng={addPinCoords.lng}
          onClose={() => { setAddPinCoords(null); setPinFormDefaults(null); }}
          onSubmit={handleAddPinSubmit}
          initialValues={pinFormDefaults ?? undefined}
        />
      )}

      <div className={`fixed bottom-3 z-30 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 shadow-sm transition-[left] duration-200 ${showAiInsights ? "left-[22rem]" : "left-20"}`}>
        <span className="font-medium text-zinc-800 dark:text-zinc-200">{pins.length}</span> people
        <span className="mx-1.5 text-zinc-400">·</span>
        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />{countByCategory["looking-for-room-and-roommate"]}</span>
        <span className="inline-flex items-center gap-1 ml-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{countByCategory["have-room-need-roommates"]}</span>
        <span className="inline-flex items-center gap-1 ml-1.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-500" />{countByCategory["sublet-room"]}</span>
      </div>
    </div>
  );
}
