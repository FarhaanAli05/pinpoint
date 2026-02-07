"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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

export default function MapPage() {
  const searchParams = useSearchParams();
  const fromStart = searchParams.get("from") === "start";
  const fromFindRoom = searchParams.get("from") === "find-room";
  const area = searchParams.get("area");
  const viewParam = searchParams.get("view") as MapViewMode | null;
  const wantRoommates = searchParams.get("wantRoommates") === "1";

  const { pins, addPin } = useApp();
  const [rentcastPins, setRentcastPins] = useState<Pin[]>([]);
  const [roommateListingsPins, setRoommateListingsPins] = useState<Pin[]>([]);
  const [mePin, setMePin] = useState<Pin | null>(null);
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
    fetch("/api/roommate-listings")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Pin[]) => { if (!cancelled) setRoommateListingsPins(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setRoommateListingsPins([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/pin")
      .then((res) => res.json())
      .then((data: { pin: Pin | null }) => { if (!cancelled && data.pin) setMePin(data.pin); })
      .catch(() => { if (!cancelled) setMePin(null); });
    return () => { cancelled = true; };
  }, []);

  const allPins = useMemo(() => [...pins, ...rentcastPins], [pins, rentcastPins]);

  const roommatePins = useMemo(() => {
    const ids = new Set(roommateListingsPins.map((p) => p.id));
    if (mePin) ids.add(mePin.id);
    const mock = getRoommatePins().filter((p) => !ids.has(p.id));
    const list = [...roommateListingsPins, ...(mePin ? [mePin] : []), ...mock];
    return list.filter((p) => ROOMMATES_CATEGORIES.includes(p.category) || (p as Pin & { isMe?: boolean }).isMe);
  }, [roommateListingsPins, mePin]);

  const [viewMode, setViewMode] = useState<MapViewMode>(() => {
    if (viewParam === "roommates" || viewParam === "listings") return viewParam;
    if (wantRoommates || fromStart) return "roommates";
    return "listings";
  });
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [addPinCoords, setAddPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMatchesPanel, setShowMatchesPanel] = useState(fromStart || wantRoommates || viewMode === "roommates");
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);

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
    return roommatePins.filter((p) => ROOMMATES_CATEGORIES.includes(p.category) || (p as Pin & { isMe?: boolean }).isMe);
  }, [allPins, viewMode, fromFindRoom, area, budgetParam, budgetMin, budgetMax, typeParam, prefsParam, roommatePins]);

  const handlePinClick = useCallback((pin: Pin) => {
    setSelectedPin(pin);
  }, []);

  const handleMapDoubleClick = useCallback((lat: number, lng: number) => {
    setAddPinCoords({ lat, lng });
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
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setRoommateListingsPins((prev) => [created, ...prev]);
          await fetch("/api/me/pin", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pin.lat,
              lng: pin.lng,
              type: pinType,
              note: pin.description,
            }),
          });
          setMePin({ ...pin, ...created, id: `me-${created.id}`, isMe: true });
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
  }, []);

  const leftPadding = showMatchesPanel ? "pl-[calc(4rem+18rem)]" : "pl-16";
  const rightPadding = selectedPin ? "pr-[min(28rem,100vw)]" : selectedProfile ? "pr-[min(20rem,100vw)]" : "pr-0";

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" data-theme="app">
      {/* Top bar: Listings | Roommates + Search (when Roommates) */}
      <div className="fixed top-4 left-20 z-30 flex flex-wrap items-center gap-2">
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
          <Link
            href="/roommates/add"
            className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 text-sm font-medium shadow-sm whitespace-nowrap"
          >
            Add me to map
          </Link>
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

      <div className={`${leftPadding} ${rightPadding} transition-[padding] duration-200`}>
        <div className="h-screen w-full">
          <MapView
            pins={pinsForMode}
            onPinClick={handlePinClick}
            selectedPinId={selectedPin?.id}
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
          onClose={() => setAddPinCoords(null)}
          onSubmit={handleAddPinSubmit}
        />
      )}

      {/* Legend: top-right — roommate types when Roommates view, else listing types */}
      {viewMode === "roommates" ? (
        <RoommateMapLegend />
      ) : (
        <div className="fixed top-4 right-4 z-30 flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 text-[11px] text-zinc-500 dark:text-zinc-400 shadow-sm">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" /> Sublet</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" /> Share</span>
        </div>
      )}

      {/* Bottom: count + hint + Add me (roommates) */}
      <div className="fixed bottom-4 left-20 z-30 flex flex-wrap items-center gap-2">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 shadow-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{pinsForMode.length}</span> {viewMode === "listings" ? "listings" : "people"}
          {viewMode === "roommates" && " · Double-click map or "}
        </div>
        {viewMode === "roommates" && (
          <Link href="/roommates/add" className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-sm font-medium">
            Add me
          </Link>
        )}
      </div>
    </div>
  );
}
