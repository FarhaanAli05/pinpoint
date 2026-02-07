"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { Pin, FitTag } from "@/lib/types";
import { UnitSummary } from "@/components/UnitSummary";
import { PinDetailsDrawer } from "@/components/PinDetailsDrawer";
import { DraftMessageModal } from "@/components/DraftMessageModal";
import { AddListingModal } from "@/components/AddListingModal";

// Dynamically import map to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      Loading map...
    </div>
  ),
});

type FilterMode = "all" | "Great" | "OK" | "Conflict";

export default function MapPage() {
  const { pins, getFitTag, unit } = useApp();
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredPins = useMemo(() => {
    if (filter === "all") return pins;
    return pins.filter((p) => getFitTag(p) === filter);
  }, [pins, filter, getFitTag]);

  const handlePinClick = useCallback((pin: Pin) => {
    setSelectedPin(pin);
  }, []);

  const filterOptions: { value: FilterMode; label: string; color: string }[] = [
    { value: "all", label: "All", color: "bg-gray-100 text-gray-700" },
    { value: "Great", label: "Great", color: "bg-green-100 text-green-700" },
    { value: "OK", label: "OK", color: "bg-indigo-100 text-indigo-700" },
    { value: "Conflict", label: "Conflict", color: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full shrink-0 overflow-y-auto border-b border-border bg-card md:w-80 md:border-b-0 md:border-r">
        {selectedPin ? (
          <>
            <PinDetailsDrawer
              pin={selectedPin}
              onClose={() => setSelectedPin(null)}
              onDraftMessage={() => setShowDraftModal(true)}
            />
          </>
        ) : (
          <div className="space-y-4 p-4">
            <UnitSummary />

            {/* Add listing CTA */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary-light"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M8 3v10M3 8h10" />
              </svg>
              Add Listing
            </button>

            {/* Roommate matches link */}
            <Link
              href="/roommates"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium text-muted transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5.5" cy="5" r="2.5" />
                <circle cx="10.5" cy="5" r="2.5" />
                <path d="M1 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
                <path d="M11 10c2 0 4 1.5 4 4" />
              </svg>
              Find Roommates
            </Link>

            {/* Filter controls */}
            {unit && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-muted uppercase tracking-wide">
                  Filter by fit
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter(opt.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        filter === opt.value
                          ? opt.color + " ring-2 ring-primary ring-offset-1"
                          : "bg-gray-50 text-muted hover:bg-gray-100"
                      }`}
                    >
                      {opt.label}
                      {opt.value !== "all" && (
                        <span className="ml-1">
                          ({pins.filter((p) => getFitTag(p) === opt.value).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Listing count */}
            <p className="text-xs text-muted">
              Showing {filteredPins.length} of {pins.length} listings
            </p>

            {/* Pin list */}
            <div className="space-y-2">
              {filteredPins.map((pin) => {
                const tag = getFitTag(pin);
                return (
                  <button
                    key={pin.id}
                    onClick={() => setSelectedPin(pin)}
                    className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:border-primary hover:bg-primary-light"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium">{pin.title}</p>
                      <FitBadge tag={tag} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      ${pin.rent}/mo &middot; {pin.address}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapView
          pins={filteredPins}
          getFitTag={getFitTag}
          onPinClick={handlePinClick}
          selectedPinId={selectedPin?.id}
        />
      </div>

      {/* Draft message modal */}
      {showDraftModal && selectedPin && (
        <DraftMessageModal
          pin={selectedPin}
          onClose={() => setShowDraftModal(false)}
        />
      )}

      {/* Add listing modal */}
      {showAddModal && (
        <AddListingModal
          onClose={() => setShowAddModal(false)}
          onAdded={(pin) => setSelectedPin(pin)}
        />
      )}
    </div>
  );
}

function FitBadge({ tag }: { tag: FitTag }) {
  const styles: Record<FitTag, string> = {
    Great: "bg-green-100 text-green-700",
    OK: "bg-indigo-100 text-indigo-700",
    Conflict: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${styles[tag]}`}
    >
      {tag}
    </span>
  );
}
