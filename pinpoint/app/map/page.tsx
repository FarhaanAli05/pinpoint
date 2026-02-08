"use client";

import { Suspense, useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useApp } from "@/lib/context";
import { Pin, ListingCategory } from "@/lib/types";
import type { StudentProfile } from "@/lib/student-profiles";
import { AREA_CENTERS } from "@/lib/seed-data";
import { getRoommatePins } from "@/lib/mock-roommates";
import { filterListingsByCriteria, budgetParamToRange } from "@/lib/listings-source";
import { ListingDetailPanel } from "@/components/ListingDetailPanel";
import { AddUserPinModal } from "@/components/AddUserPinModal";
import { RoommateMapLegend } from "@/components/RoommateMapLegend";
import { MapSearchBar } from "@/components/MapSearchBar";
import { StudentsLikeYouPanel } from "@/components/StudentsLikeYouPanel";
import { StudentProfileDetailPanel } from "@/components/StudentProfileDetailPanel";
import { AIInsightsSidebar, type AIRanking } from "@/components/AIInsightsSidebar";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 text-sm">
      Loading map...
    </div>
  ),
});

export type MapViewMode = "listings" | "roommates";

const LISTINGS_CATEGORIES: ListingCategory[] = ["sublet", "share-listing"];
const ROOMMATES_CATEGORIES: ListingCategory[] = [
  "looking-for-roommates",
  "looking-for-room-and-roommate",
  "have-room-need-roommates",
  "sublet-room",
];

function MapPageContent() {
  const searchParams = useSearchParams();
  const fromStart = searchParams.get("from") === "start";
  const fromFindRoom = searchParams.get("from") === "find-room";
  const area = searchParams.get("area");
  const viewParam = searchParams.get("view") as MapViewMode | null;
  const wantRoommates = searchParams.get("wantRoommates") === "1";

  const { pins, addPin } = useApp();
  const [rentcastPins, setRentcastPins] = useState<Pin[]>([]);
  const [roommateListingsPins, setRoommateListingsPins] = useState<Pin[]>([]);
  const [flyToCenter, setFlyToCenter] = useState<{ lat: number; lng: number } | null>(null);
  const initialCenter = (fromStart || fromFindRoom) && area && AREA_CENTERS[area] ? AREA_CENTERS[area] : undefined;

  const budgetParam = searchParams.get("budget");
  const { min: budgetMin, max: budgetMax } = budgetParamToRange(budgetParam);
  useEffect(() => {
    let cancelled = false;
    const city = searchParams.get("city") ?? "Kingston";
    const state = searchParams.get("state") ?? "ON";
    const params = new URLSearchParams({ city, state });
    if (budgetMin != null) params.set("minPrice", String(budgetMin));
    if (budgetMax != null) params.set("maxPrice", String(budgetMax));
    fetch(`/api/rentcast/listings?${params}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Pin[]) => { if (!cancelled) setRentcastPins(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setRentcastPins([]); });
    return () => { cancelled = true; };
  }, [searchParams, budgetMin, budgetMax]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/roommate-listings", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Pin[]) => { if (!cancelled) setRoommateListingsPins(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setRoommateListingsPins([]); });
    return () => { cancelled = true; };
  }, []);

  const allPins = useMemo(() => [...pins, ...rentcastPins], [pins, rentcastPins]);

  const roommatePins = useMemo(() => {
    const ids = new Set(roommateListingsPins.map((p) => p.id));
    const mock = getRoommatePins().filter((p) => !ids.has(p.id));
    const list = [...roommateListingsPins, ...mock];
    return list.filter((p) => ROOMMATES_CATEGORIES.includes(p.category) || p.isMe);
  }, [roommateListingsPins]);

  const [viewMode, setViewMode] = useState<MapViewMode>(() => {
    if (viewParam === "roommates" || viewParam === "listings") return viewParam;
    if (wantRoommates || fromStart) return "roommates";
    return "listings";
  });
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [addPinCoords, setAddPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pinFormDefaults, setPinFormDefaults] = useState<{ name?: string; email?: string; budget?: string; move_in_from?: string; notes?: string } | null>(null);
  const [showMatchesPanel, setShowMatchesPanel] = useState(fromStart || wantRoommates || viewMode === "roommates");
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [aiInsightsRankings, setAiInsightsRankings] = useState<AIRanking[]>([]);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);
  const [aiInsightsHasSearched, setAiInsightsHasSearched] = useState(false);

  useEffect(() => {
    if (viewParam === "roommates" || viewParam === "listings") setViewMode(viewParam);
  }, [viewParam]);

  const typeParam = searchParams.get("type");
  const prefsParam = searchParams.get("prefs");

  const pinsForMode = useMemo(() => {
    if (viewMode === "listings") {
      let list = allPins.filter((p) => LISTINGS_CATEGORIES.includes(p.category));
      if (fromFindRoom && (area || budgetParam || typeParam || prefsParam)) {
        list = filterListingsByCriteria(list, {
          area: area ?? undefined,
          budgetMin: budgetMin ?? undefined,
          budgetMax: budgetMax ?? undefined,
          type: (typeParam === "room" || typeParam === "whole-unit" ? typeParam : undefined) as "room" | "whole-unit" | undefined,
          prefs: prefsParam ? prefsParam.split(",") : undefined,
        });
      }
      return list;
    }
    return roommatePins.filter((p) => ROOMMATES_CATEGORIES.includes(p.category) || p.isMe);
  }, [allPins, viewMode, fromFindRoom, area, budgetParam, budgetMin, budgetMax, typeParam, prefsParam, roommatePins]);

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

  const handleAddPinSubmit = useCallback(
    async (pin: Pin) => {
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
          setRoommateListingsPins((prev) => [created, ...prev]);
        } else {
          addPin(pin);
        }
      } catch {
        addPin(pin);
      }
      setSelectedPin(pin);
      setAddPinCoords(null);
    },
    [addPin]
  );

  const handleSearchResult = useCallback((result: { lat: number; lng: number; label: string }) => {
    setFlyToCenter(null);
    setTimeout(() => setFlyToCenter({ lat: result.lat, lng: result.lng }), 50);
  }, []);

  const handleAddMeHere = useCallback((lat: number, lng: number) => {
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
        setRoommateListingsPins((prev) => prev.filter((p) => p.id !== pin.id));
        setDeleteMessage("Pin deleted");
        setTimeout(() => setDeleteMessage(null), 3000);
        fetch("/api/roommate-listings", { cache: "no-store", credentials: "include" })
          .then((r) => (r.ok ? r.json() : []))
          .then((list: Pin[]) => setRoommateListingsPins(Array.isArray(list) ? list : []))
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }, []);

  const pinsForModeById = useMemo(() => new Map(pinsForMode.map((p) => [p.id, p])), [pinsForMode]);
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

  const leftPadding = showMatchesPanel ? "pl-[22rem]" : "pl-16";
  const rightPadding = selectedPin ? "pr-[min(28rem,100vw)]" : selectedProfile ? "pr-[min(20rem,100vw)]" : showAiInsights ? "pr-72" : "pr-0";

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" data-theme="app">
      {deleteMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium shadow-lg animate-in fade-in duration-200">
          {deleteMessage}
        </div>
      )}
      {/* Top bar: Listings | Roommates + Search (when Roommates) — shift right when sidebars open */}
      <div
        className={`fixed top-4 z-30 flex flex-wrap items-center gap-2 transition-[left] duration-200 ${showMatchesPanel ? "left-[22rem]" : "left-20"}`}
      >
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => { setViewMode("listings"); setShowMatchesPanel(false); }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === "listings" ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
          >
            Listings
          </button>
          <button
            type="button"
            onClick={() => { setViewMode("roommates"); setShowMatchesPanel(true); }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === "roommates" ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
          >
            Roommates
            {viewMode === "roommates" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />}
          </button>
        </div>
        <MapSearchBar
          viewMode={viewMode}
          onSearch={handleSearchResult}
          onAddMeHere={handleAddMeHere}
        />
        {viewMode === "roommates" && (
          <button
            type="button"
            onClick={handleOpenAiInsights}
            className="rounded-md px-3 py-2 text-sm font-medium bg-amber-500 dark:bg-amber-600 text-white hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors"
          >
            AI insights
          </button>
        )}

      </div>

      {showMatchesPanel && (
        <StudentsLikeYouPanel
          onClose={() => setShowMatchesPanel(false)}
          selectedProfile={selectedProfile}
          onSelectProfile={setSelectedProfile}
          showAiAnalyzed={fromStart || fromFindRoom}
        />
      )}

      {showAiInsights && (
        <div className="fixed right-0 top-0 bottom-0 z-40 w-72">
          <AIInsightsSidebar
            onClose={() => setShowAiInsights(false)}
            rankings={aiInsightsRankings}
            pinsById={pinsForModeById}
            onSelectPin={(pin) => { setSelectedPin(pin); setSelectedProfile(null); }}
            onSearch={handleAiSearch}
            hasSearched={aiInsightsHasSearched}
            loading={aiInsightsLoading}
            error={aiInsightsError}
          />
        </div>
      )}

      <div className={`${leftPadding} ${rightPadding} transition-[padding] duration-200`}>
        <div className="h-screen w-full">
          <MapView
            pins={pinsForMode}
            onPinClick={handlePinClick}
            selectedPinId={selectedPin?.id}
            onMapClick={() => setSelectedPin(null)}
            onMapDoubleClick={handleMapDoubleClick}
            initialCenter={initialCenter}
            animateZoom={!!initialCenter}
            flyToCenter={flyToCenter}
          />
        </div>
      </div>

      {selectedPin && (
        <ListingDetailPanel
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          onDelete={handleDeletePin}
        />
      )}

      {selectedProfile && (
        <StudentProfileDetailPanel
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}

      {addPinCoords && (
        <AddUserPinModal
          lat={addPinCoords.lat}
          lng={addPinCoords.lng}
          onClose={() => { setAddPinCoords(null); setPinFormDefaults(null); }}
          onSubmit={handleAddPinSubmit}
          initialValues={pinFormDefaults ?? undefined}
        />
      )}

      {/* Legend: top-right — roommate types when Roommates view, else listing types */}
      {viewMode === "roommates" ? (
        <RoommateMapLegend />
      ) : (
        <div className="fixed top-4 right-14 z-30 flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 text-[11px] text-zinc-500 dark:text-zinc-400 shadow-sm">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" /> Sublet</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" /> Share</span>
        </div>
      )}

      {/* Bottom: count + hint + Add me (roommates) — shift right when sidebars open */}
      <div
        className={`fixed bottom-4 z-30 flex flex-wrap items-center gap-2 transition-[left] duration-200 ${
          showMatchesPanel ? "left-[22rem]" : "left-20"
        }`}
      >
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 shadow-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{pinsForMode.length}</span> {viewMode === "listings" ? "listings" : "people"}
          {viewMode === "roommates" && " · Double-click map to add yourself"}
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading map...</p>
      </div>
    }>
      <MapPageContent />
    </Suspense>
  );
}
