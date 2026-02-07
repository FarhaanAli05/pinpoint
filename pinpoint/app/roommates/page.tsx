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
  const [mePin, setMePin] = useState<Pin | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    fetch("/api/roommate-listings")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Pin[]) => { if (!cancelled) setRoommateListings(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setRoommateListings([]); });
    return () => { cancelled = true; };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    fetch("/api/me/pin")
      .then((res) => res.json())
      .then((data: { pin: Pin | null }) => { if (!cancelled && data.pin) setMePin(data.pin); })
      .catch(() => { if (!cancelled) setMePin(null); });
    return () => { cancelled = true; };
  }, [mounted]);

  const pins = useMemo(() => {
    if (!mounted) {
      return MOCK_ROOMMATES.filter((p) => ROOMMATES_CATEGORIES.includes(p.category));
    }
    const ids = new Set(roommateListings.map((p) => p.id));
    if (mePin) ids.add(mePin.id);
    const mock = getRoommatePins().filter((p) => !ids.has(p.id));
    const combined = [...roommateListings, ...(mePin ? [mePin] : []), ...mock];
    return combined.filter((p) => ROOMMATES_CATEGORIES.includes(p.category) || (p as Pin & { isMe?: boolean }).isMe);
  }, [mounted, roommateListings, mePin]);

  const handlePinClick = useCallback((pin: Pin) => {
    setSelectedPin(pin);
    setSelectedProfile(null);
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
      <div className="fixed top-4 left-20 z-30 flex items-center gap-2">
        <span className="text-sm font-medium text-amber-900 dark:text-amber-100">Roommates</span>
        <Link href="/roommates/add" className="rounded-md bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-sm font-medium">
          Add me
        </Link>
        <button
          type="button"
          onClick={() => setShowSuggestions((s) => !s)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${showSuggestions ? "bg-zinc-700 dark:bg-zinc-600 text-white" : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"}`}
        >
          Matches
        </button>
      </div>
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2">
        <RoommateMapLegend />
        <Link href="/listings/map" className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Listings
        </Link>
      </div>

      {/* Suggested matches: only when toggled */}
      {showSuggestions && (
        <div className="fixed left-20 top-14 z-30 w-56 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
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

      <div className="pl-16 pr-0 pt-12 pb-0">
        <div className="h-[calc(100vh-3rem)] w-full">
          <MapView
            pins={pins}
            onPinClick={handlePinClick}
            selectedPinId={selectedPin?.id}
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
        </div>
      )}

      {selectedProfile && <StudentProfileDetailPanel profile={selectedProfile} onClose={() => setSelectedProfile(null)} />}

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
