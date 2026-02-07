"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { Pin, FitTag } from "@/lib/types";
import { MatchResult, getTopMatches } from "@/lib/roommate-match";
import { UnitSummary } from "@/components/UnitSummary";
import { PinDetailsDrawer } from "@/components/PinDetailsDrawer";
import { RoommateDetailsDrawer } from "@/components/RoommateDetailsDrawer";
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
  const {
    pins,
    getFitTag,
    unit,
    roommateProfiles,
    myProfileId,
    lookingForRoommates,
    setLookingForRoommates,
  } = useApp();

  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [selectedRoommate, setSelectedRoommate] = useState<MatchResult | null>(
    null
  );
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Layers
  const [showListings, setShowListings] = useState(true);
  const [showRoommates, setShowRoommates] = useState<boolean | null>(null); // null = use default

  // Resolve my profile
  const myProfile = useMemo(
    () => roommateProfiles.find((p) => p.id === myProfileId) ?? null,
    [roommateProfiles, myProfileId]
  );

  // Compute roommate matches
  const roommateMatches = useMemo(() => {
    if (!myProfile) return [];
    return getTopMatches(myProfile, roommateProfiles);
  }, [myProfile, roommateProfiles]);

  // Default roommate layer: ON if looking, OFF otherwise
  const roommateLayerOn =
    showRoommates !== null
      ? showRoommates
      : lookingForRoommates && !!myProfile;

  const filteredPins = useMemo(() => {
    if (!showListings) return [];
    if (filter === "all") return pins;
    return pins.filter((p) => getFitTag(p) === filter);
  }, [pins, filter, getFitTag, showListings]);

  const handlePinClick = useCallback(
    (pin: Pin) => {
      setSelectedPin(pin);
      setSelectedRoommate(null);
    },
    []
  );

  const handleRoommateClick = useCallback(
    (match: MatchResult) => {
      setSelectedRoommate(match);
      setSelectedPin(null);
    },
    []
  );

  const filterOptions: { value: FilterMode; label: string; color: string }[] = [
    { value: "all", label: "All", color: "bg-gray-100 text-gray-700" },
    { value: "Great", label: "Great", color: "bg-green-100 text-green-700" },
    { value: "OK", label: "OK", color: "bg-indigo-100 text-indigo-700" },
    {
      value: "Conflict",
      label: "Conflict",
      color: "bg-red-100 text-red-700",
    },
  ];

  // Sidebar content when nothing is selected
  const renderDefaultSidebar = () => (
    <div className="space-y-4 p-4">
      <UnitSummary />

      {/* Add listing CTA */}
      <button
        onClick={() => setShowAddModal(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary-light"
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
        Add Listing
      </button>

      {/* Roommate matches link */}
      <Link
        href="/roommates"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium text-muted transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="5.5" cy="5" r="2.5" />
          <circle cx="10.5" cy="5" r="2.5" />
          <path d="M1 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
          <path d="M11 10c2 0 4 1.5 4 4" />
        </svg>
        Find Roommates
      </Link>

      {/* Map Layers */}
      <div>
        <h3 className="mb-2 text-xs font-semibold text-muted uppercase tracking-wide">
          Map Layers
        </h3>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showListings}
              onChange={(e) => setShowListings(e.target.checked)}
              className="accent-primary h-3.5 w-3.5"
            />
            <span className="text-foreground">Housing listings</span>
          </label>

          {myProfile ? (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={roommateLayerOn}
                onChange={(e) => setShowRoommates(e.target.checked)}
                className="accent-primary h-3.5 w-3.5"
              />
              <span className="text-foreground">
                Compatible roommates ({roommateMatches.length})
              </span>
            </label>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-2.5">
              <p className="text-xs text-muted">
                <Link
                  href="/roommates"
                  className="text-primary underline hover:text-primary-hover"
                >
                  Create a roommate profile
                </Link>{" "}
                to see compatible roommates on the map.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Looking for roommates toggle */}
      {myProfile && (
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            role="switch"
            aria-checked={lookingForRoommates}
            onClick={() => setLookingForRoommates(!lookingForRoommates)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              lookingForRoommates ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                lookingForRoommates ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
          <span className="text-xs text-muted">Looking for roommates</span>
        </label>
      )}

      {/* Filter controls */}
      {unit && showListings && (
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
      {showListings && (
        <p className="text-xs text-muted">
          Showing {filteredPins.length} of {pins.length} listings
        </p>
      )}

      {/* Pin list */}
      {showListings && (
        <div className="space-y-2">
          {filteredPins.map((pin) => {
            const tag = getFitTag(pin);
            return (
              <button
                key={pin.id}
                onClick={() => handlePinClick(pin)}
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
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full shrink-0 overflow-y-auto border-b border-border bg-card md:w-80 md:border-b-0 md:border-r">
        {selectedPin ? (
          <PinDetailsDrawer
            pin={selectedPin}
            onClose={() => setSelectedPin(null)}
            onDraftMessage={() => setShowDraftModal(true)}
          />
        ) : selectedRoommate && myProfile ? (
          <RoommateDetailsDrawer
            match={selectedRoommate}
            myProfile={myProfile}
            onClose={() => setSelectedRoommate(null)}
          />
        ) : (
          renderDefaultSidebar()
        )}
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapView
          pins={filteredPins}
          getFitTag={getFitTag}
          onPinClick={handlePinClick}
          selectedPinId={selectedPin?.id}
          showRoommateLayer={roommateLayerOn}
          roommateMatches={roommateMatches}
          selectedRoommateId={selectedRoommate?.profile.id ?? null}
          onRoommateClick={handleRoommateClick}
          showAnchor={!!myProfile}
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
          onAdded={(pin) => {
            setSelectedPin(pin);
            setSelectedRoommate(null);
          }}
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
