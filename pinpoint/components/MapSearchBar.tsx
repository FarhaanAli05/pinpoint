"use client";

import { useState } from "react";
import { AREA_CENTERS, QUEENS_CAMPUS } from "@/lib/seed-data";

const SEARCH_OPTIONS: { value: string; label: string; lat: number; lng: number }[] = [
  { value: "near-campus", label: "Near campus", lat: AREA_CENTERS["near-campus"].lat, lng: AREA_CENTERS["near-campus"].lng },
  { value: "downtown", label: "Downtown Kingston", lat: AREA_CENTERS.downtown.lat, lng: AREA_CENTERS.downtown.lng },
  { value: "west-end", label: "West end", lat: AREA_CENTERS["west-end"].lat, lng: AREA_CENTERS["west-end"].lng },
  { value: "kingston", label: "Kingston (centre)", lat: QUEENS_CAMPUS.lat + 0.006, lng: QUEENS_CAMPUS.lng + 0.01 },
];

export interface SearchResult {
  lat: number;
  lng: number;
  label: string;
  lookingFor?: "room-only" | "room-and-roommate";
  peopleCount?: number;
}

interface MapSearchBarProps {
  onSearch: (result: SearchResult) => void;
  /** After search, user can click "Add myself here" — we call this with the same coords */
  onAddMeHere?: (lat: number, lng: number) => void;
  viewMode: "listings" | "roommates";
}

export function MapSearchBar({ onSearch, onAddMeHere, viewMode }: MapSearchBarProps) {
  const [location, setLocation] = useState("near-campus");
  const [lookingFor, setLookingFor] = useState<"room-only" | "room-and-roommate">("room-and-roommate");
  const [peopleCount, setPeopleCount] = useState<string>("");
  const [lastResult, setLastResult] = useState<SearchResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const opt = SEARCH_OPTIONS.find((o) => o.value === location) ?? SEARCH_OPTIONS[0];
    if (!opt) return;
    const result: SearchResult = {
      lat: opt.lat,
      lng: opt.lng,
      label: opt.label,
      lookingFor,
      peopleCount: peopleCount === "" ? undefined : Math.max(1, Math.min(10, parseInt(peopleCount, 10) || 1)),
    };
    setLastResult(result);
    onSearch(result);
  };

  if (viewMode !== "roommates") return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-sm p-2 z-30">
      <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
        Search location & add yourself
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-2 text-sm text-zinc-950 dark:text-white focus:ring-1 focus:ring-zinc-400"
          aria-label="Location"
        >
          {SEARCH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={lookingFor}
          onChange={(e) => setLookingFor(e.target.value as "room-only" | "room-and-roommate")}
          className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-2 text-sm text-zinc-950 dark:text-white focus:ring-1 focus:ring-zinc-400"
          aria-label="Looking for"
        >
          <option value="room-only">Room only</option>
          <option value="room-and-roommate">Room + roommate</option>
        </select>
        <input
          type="number"
          min={1}
          max={10}
          placeholder="# people"
          value={peopleCount}
          onChange={(e) => setPeopleCount(e.target.value.replace(/\D/g, "").slice(0, 2))}
          className="w-16 rounded-md border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-2 text-sm text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-400"
          aria-label="How many people"
        />
        <button
          type="submit"
          className="rounded-md px-3 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
        >
          Search
        </button>
      </form>
      {lastResult && onAddMeHere && (
        <button
          type="button"
          onClick={() => onAddMeHere(lastResult.lat, lastResult.lng)}
          className="rounded-md border border-amber-500/60 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-2 text-xs font-medium hover:bg-amber-500/20 dark:hover:bg-amber-500/30 transition-colors"
        >
          Add myself here →
        </button>
      )}
    </div>
  );
}
