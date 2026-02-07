"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "@/components/SessionProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ListingCategory } from "@/lib/types";

const ROOMMATE_TYPE_OPTIONS: { value: ListingCategory; label: string; shortLabel: string }[] = [
  { value: "looking-for-room-and-roommate", label: "I'm looking for a room AND a roommate", shortLabel: "Looking for room + roommate" },
  { value: "have-room-need-roommates", label: "I have a room found and need people to share with", shortLabel: "Have room, need people" },
  { value: "sublet-room", label: "I have a sublease and want to rent out my room", shortLabel: "Subletting a room" },
];

interface LocationResult {
  display_name: string;
  lat: number;
  lon: number;
}

export default function AddRoommatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [listingType, setListingType] = useState<ListingCategory>("looking-for-room-and-roommate");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [peopleCount, setPeopleCount] = useState<string>("");
  const [fromWhen, setFromWhen] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchLocation = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setLocationResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setLocationResults(Array.isArray(data) ? data : []);
      setShowDropdown(true);
    } catch {
      setLocationResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!locationQuery.trim()) {
      setLocationResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => searchLocation(locationQuery), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [locationQuery, searchLocation]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocation = (loc: LocationResult) => {
    setSelectedLocation(loc);
    setLocationQuery(loc.display_name);
    setShowDropdown(false);
    setLocationResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (session?.user?.email as string | undefined) ?? "test@example.com";
    if (!selectedLocation) return;

    const option = ROOMMATE_TYPE_OPTIONS.find((o) => o.value === listingType);
    const title = option?.shortLabel ?? "Roommate";
    const description = note.trim() || "Email to connect.";
    const pinnedType = listingType === "sublet-room" ? "need-roommates" : listingType === "have-room-need-roommates" ? "need-roommates" : "need-room";
    const peopleCountNum = peopleCount === "" ? undefined : Math.min(20, Math.max(1, parseInt(peopleCount, 10) || 1));

    try {
      const res = await fetch("/api/roommate-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: selectedLocation.lat,
          lng: selectedLocation.lon,
          category: listingType,
          title,
          description,
          contactEmail: email,
          address: selectedLocation.display_name,
          areaLabel: selectedLocation.display_name,
          moveInDate: fromWhen,
          rent: 0,
          peopleCount: peopleCountNum,
        }),
      });
      if (res.ok) {
        await fetch("/api/me/pin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: selectedLocation.lat,
            lng: selectedLocation.lon,
            type: pinnedType,
            note: description,
          }),
        });
      }
    } catch {
      // fallback
    }
    router.replace("/roommates");
  };

  const email = session?.user?.email ?? "test@example.com";
  const today = new Date().toISOString().slice(0, 10);
  const canSubmit = !!selectedLocation;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" data-theme="app">
      <main className="pl-16 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-white mb-1">List yourself</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Others will see you on the roommates map and can email you.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">I am…</label>
              <div className="space-y-2">
                {ROOMMATE_TYPE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 has-[:checked]:border-zinc-400 dark:has-[:checked]:border-zinc-500 has-[:checked]:ring-1 has-[:checked]:ring-zinc-400 dark:has-[:checked]:ring-zinc-500"
                  >
                    <input
                      type="radio"
                      name="listingType"
                      value={opt.value}
                      checked={listingType === opt.value}
                      onChange={() => setListingType(opt.value)}
                      className="rounded-full border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                    />
                    <span className="text-sm text-zinc-950 dark:text-white">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email (verified)</label>
              <input type="email" value={email} readOnly className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-600 dark:text-zinc-400 text-sm" />
            </div>

            <div className="relative" ref={dropdownRef}>
              <label htmlFor="location" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Where do you want roommates? (search city or area)
              </label>
              <input
                id="location"
                type="text"
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setSelectedLocation(null);
                }}
                placeholder="e.g. Kingston ON, Toronto, Near Queen's University"
                required
                autoComplete="off"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searching && (
                <p className="absolute right-3 top-9 text-xs text-zinc-400">Searching…</p>
              )}
              {showDropdown && locationResults.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg max-h-48 overflow-y-auto">
                  {locationResults.map((loc, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full text-left px-3 py-2.5 text-sm text-zinc-950 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                      >
                        {loc.display_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedLocation && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Selected: {selectedLocation.display_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="peopleCount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                How many roommates? (optional)
              </label>
              <input
                id="peopleCount"
                type="number"
                min={1}
                max={20}
                value={peopleCount}
                onChange={(e) => setPeopleCount(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="e.g. 1 or 2"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="fromWhen" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">From when?</label>
              <input
                id="fromWhen"
                type="date"
                value={fromWhen}
                min={today}
                onChange={(e) => setFromWhen(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-950 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Short note (optional)</label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Student, budget ~$700"
                rows={2}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:outline-none resize-none"
              />
            </div>

            <button type="submit" disabled={!canSubmit} className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 py-2.5 font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              Add me to roommates map
            </button>
          </form>
          <Link href="/listings" className="mt-4 block text-center text-sm text-zinc-500 hover:underline">← Back to listings</Link>
        </div>
      </main>
    </div>
  );
}
