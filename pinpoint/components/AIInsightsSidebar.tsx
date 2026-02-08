"use client";

import { useState } from "react";
import type { Pin } from "@/lib/types";

export type MatchLevel = "recommended" | "likely" | "less_likely";

export type AIRanking = {
  id: string;
  rank: number;
  reason: string;
  matchLevel?: MatchLevel;
  title?: string;
  areaLabel?: string;
  rent?: number;
  moveInDate?: string;
};

interface AIInsightsSidebarProps {
  onClose: () => void;
  rankings: AIRanking[];
  pinsById: Map<string, Pin>;
  onSelectPin: (pin: Pin) => void;
  /** Called when user clicks Find matches; parent should POST with this query and set rankings/loading/error */
  onSearch: (query: string) => void;
  /** True after user has submitted at least one search (so we can show "No matches" vs initial prompt) */
  hasSearched?: boolean;
  loading?: boolean;
  error?: string | null;
}

/** Small circle color for each match level (green / yellow / red) */
const MATCH_DOT: Record<MatchLevel, string> = {
  recommended: "bg-green-500 dark:bg-green-400",
  likely: "bg-amber-500 dark:bg-amber-400",
  less_likely: "bg-red-500 dark:bg-red-400",
};
const MATCH_LABEL: Record<MatchLevel, string> = {
  recommended: "Recommended",
  likely: "Likely",
  less_likely: "Less likely",
};

export function AIInsightsSidebar({
  onClose,
  rankings,
  pinsById,
  onSelectPin,
  onSearch,
  hasSearched = false,
  loading = false,
  error = null,
}: AIInsightsSidebarProps) {
  const [queryInput, setQueryInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = queryInput.trim();
    if (q) onSearch(q);
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-72 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden animate-slide-in-right">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-2 shrink-0">
        <div>
          <h2 className="font-mono text-sm font-semibold text-zinc-950 dark:text-white">
            AI roommate match
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Describe what you want; we’ll match from roommate listings.
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close panel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 flex flex-col">
        <form onSubmit={handleSubmit} className="shrink-0 space-y-2">
          <label htmlFor="roommate-query" className="sr-only">What kind of roommate do you want?</label>
          <textarea
            id="roommate-query"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="e.g. quiet roommate near campus, budget under $800, move-in May"
            rows={3}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 resize-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !queryInput.trim()}
            className="w-full rounded-lg bg-amber-500 dark:bg-amber-600 text-white text-sm font-medium py-2 px-3 hover:bg-amber-600 dark:hover:bg-amber-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {loading ? "Matching…" : "Find matches"}
          </button>
        </form>
        {loading && (
          <div className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Matching roommate listings…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {!loading && !error && rankings.length === 0 && (
          <div className="py-6 px-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {hasSearched ? (
              <>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">No matches</p>
                <p className="mt-1">Try different keywords or check that roommate_listings has data in Supabase.</p>
              </>
            ) : (
              <>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">What kind of roommate do you want?</p>
                <p className="mt-1">Describe above and click Find matches to search the roommate listings table.</p>
              </>
            )}
          </div>
        )}
        {!loading && rankings.length > 0 && (
          <ul className="space-y-3">
            {rankings.map((r) => {
              const pin = pinsById.get(r.id);
              const title = pin?.title ?? r.title ?? "Listing";
              const locationLine = pin
                ? [pin.areaLabel ?? pin.address, pin.rent ? `$${pin.rent}/mo` : null, pin.moveInDate].filter(Boolean).join(" · ")
                : [r.areaLabel, r.rent != null ? `$${r.rent}/mo` : null, r.moveInDate].filter(Boolean).join(" · ") || "";
              const canSelect = !!pin;
              const level = r.matchLevel ?? "likely";
              const dotClass = MATCH_DOT[level];
              const label = MATCH_LABEL[level];
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => canSelect && onSelectPin(pin!)}
                    className={`w-full text-left rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 p-3 transition-colors ${canSelect ? "hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${dotClass}`} title={label} aria-hidden />
                      <span className="shrink-0 w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center justify-center">
                        {r.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-950 dark:text-white text-sm">{title}</p>
                        {locationLine && (
                          <p className="text-xs text-zinc-500 mt-0.5">{locationLine}</p>
                        )}
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 line-clamp-2">{r.reason}</p>
                        {canSelect && (
                          <span className="inline-block mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            View on map →
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
