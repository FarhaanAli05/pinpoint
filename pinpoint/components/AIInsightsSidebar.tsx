"use client";

import type { Pin } from "@/lib/types";

export type AIRanking = { id: string; rank: number; reason: string; title?: string; areaLabel?: string; rent?: number; moveInDate?: string };

interface AIInsightsSidebarProps {
  onClose: () => void;
  rankings: AIRanking[];
  pinsById: Map<string, Pin>;
  onSelectPin: (pin: Pin) => void;
  loading?: boolean;
  error?: string | null;
}

export function AIInsightsSidebar({
  onClose,
  rankings,
  pinsById,
  onSelectPin,
  loading = false,
  error = null,
}: AIInsightsSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-72 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden animate-in slide-in-from-left duration-200">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-2 shrink-0">
        <div>
          <h2 className="font-mono text-sm font-semibold text-zinc-950 dark:text-white">
            AI roommate match
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Best to worst by your preferences, location &amp; details.
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
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading && (
          <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Finding your best matches…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {!loading && !error && rankings.length === 0 && (
          <div className="py-8 px-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">No other roommates yet</p>
            <p className="mt-1">When others add their listings, we’ll rank your best matches here.</p>
          </div>
        )}
        {!loading && rankings.length > 0 && (
          <ul className="space-y-3">
            {rankings.map((r) => {
              const pin = pinsById.get(r.id);
              const title = pin?.title ?? r.title ?? "Listing";
              const locationLine = pin
                ? [pin.areaLabel ?? pin.address, pin.rent ? `$${pin.rent}/mo` : null, pin.moveInDate].filter(Boolean).join(" · ")
                : [r.areaLabel, r.rent != null ? `$${r.rent}/mo` : null, r.moveInDate].filter(Boolean).join(" · ") || "Profile";
              const canSelect = !!pin;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => canSelect && onSelectPin(pin!)}
                    className={`w-full text-left rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 p-3 transition-colors ${canSelect ? "hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer" : "cursor-default"}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 w-8 h-8 rounded-lg bg-amber-500 dark:bg-amber-600 text-white text-sm font-bold flex items-center justify-center">
                        {r.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-950 dark:text-white text-sm">{title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{locationLine}</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 line-clamp-2">{r.reason}</p>
                        {canSelect && (
                          <span className="inline-block mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
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
