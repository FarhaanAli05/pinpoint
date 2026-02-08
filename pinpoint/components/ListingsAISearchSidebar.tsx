"use client";

import { useState, useRef } from "react";
import type { Pin } from "@/lib/types";

interface ListingsAISearchSidebarProps {
  listings: Pin[];
  onSelectPin: (pin: Pin) => void;
  onClose: () => void;
  /** Result IDs from parent (map filters by these when set) */
  resultIds: string[] | null;
  /** Called when search returns so parent can filter map */
  onResults: (ids: string[]) => void;
  onClearResults: () => void;
}

export function ListingsAISearchSidebar({
  listings,
  onSelectPin,
  onClose,
  resultIds,
  onResults,
  onClearResults,
}: ListingsAISearchSidebarProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRegionRef = useRef<HTMLDivElement>(null);

  const hasSearched = resultIds !== null;
  const resultPins = (resultIds ?? [])
    .map((id) => listings.find((p) => p.id === id))
    .filter((p): p is Pin => p != null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/listings/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Search failed");
        onResults([]);
        return;
      }
      onResults(data.listingIds ?? []);
      resultsRegionRef.current?.focus({ preventScroll: true });
    } catch {
      setError("Search failed");
      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className="fixed right-0 top-0 z-40 h-screen w-full max-w-md border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col shadow-2xl"
      role="complementary"
      aria-label="AI search results"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-4">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">Find with AI</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white transition-colors"
          aria-label="Close AI search"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="ai-search-query" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Describe what you want
          </label>
          <textarea
            id="ai-search-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. cheap room near Queen's, under $1000, pet-friendly, quiet..."
            rows={3}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 focus:border-transparent resize-y min-h-[4rem]"
            disabled={loading}
            aria-describedby={error ? "ai-search-error" : undefined}
          />
          {error && (
            <p id="ai-search-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex-1 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2.5 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-busy={loading}
            >
              {loading ? "Checking…" : "Check"}
            </button>
            {hasSearched && (
              <button
                type="button"
                onClick={() => { setError(null); onClearResults(); }}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        <div
          ref={resultsRegionRef}
          tabIndex={-1}
          role="region"
          aria-live="polite"
          aria-label="Search results"
          className="flex flex-col gap-3"
        >
          {hasSearched && (
            <>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {resultPins.length === 0
                  ? "No matching listings."
                  : `${resultPins.length} result${resultPins.length !== 1 ? "s" : ""}`}
              </p>
              <ul className="space-y-3 list-none p-0 m-0">
                {resultPins.map((pin) => (
                  <li key={pin.id}>
                    <ListingResultCard pin={pin} onSelect={() => onSelectPin(pin)} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function ListingResultCard({ pin, onSelect }: { pin: Pin; onSelect: () => void }) {
  const [imgError, setImgError] = useState(false);
  const imgUrl = pin.images?.[0];
  const displayImgUrl =
    imgUrl?.startsWith("https://media.kijiji.ca/")
      ? `/api/image-proxy?url=${encodeURIComponent(imgUrl)}`
      : imgUrl;

  return (
    <article
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
      aria-labelledby={`card-title-${pin.id}`}
    >
      <div className="flex gap-3 p-3">
        {imgUrl && !imgError ? (
          <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800">
            <img
              src={displayImgUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="w-20 h-20 shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 id={`card-title-${pin.id}`} className="font-medium text-zinc-950 dark:text-white text-sm line-clamp-2">
            {pin.title}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{pin.address}</p>
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mt-1">
            {pin.rent > 0 ? `$${pin.rent}/mo` : "—"}
          </p>
          <button
            type="button"
            onClick={onSelect}
            className="mt-2 rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            View on map
          </button>
        </div>
      </div>
    </article>
  );
}
