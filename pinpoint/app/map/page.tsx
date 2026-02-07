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
  const [selectedRoommate, setSelectedRoommate] = useState<MatchResult | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Layers
  const [showListings, setShowListings] = useState(true);
  const [showRoommates, setShowRoommates] = useState<boolean | null>(null);

  const myProfile = useMemo(
    () => roommateProfiles.find((p) => p.id === myProfileId) ?? null,
    [roommateProfiles, myProfileId]
  );

  const roommateMatches = useMemo(() => {
    if (!myProfile) return [];
    return getTopMatches(myProfile, roommateProfiles);
  }, [myProfile, roommateProfiles]);

  const roommateLayerOn =
    showRoommates !== null ? showRoommates : lookingForRoommates && !!myProfile;

  const filteredPins = useMemo(() => {
    if (!showListings) return [];
    if (filter === "all") return pins;
    return pins.filter((p) => getFitTag(p) === filter);
  }, [pins, filter, getFitTag, showListings]);

  const handlePinClick = useCallback((pin: Pin) => {
    setSelectedPin(pin);
    setSelectedRoommate(null);
  }, []);

  const handleRoommateClick = useCallback((match: MatchResult) => {
    setSelectedRoommate(match);
    setSelectedPin(null);
  }, []);

  const filterOptions: { value: FilterMode; label: string }[] = [
    { value: "all", label: "All" },
    { value: "Great", label: "Great" },
    { value: "OK", label: "OK" },
    { value: "Conflict", label: "Conflict" },
  ];

  const hasDrawerContent = selectedPin || (selectedRoommate && myProfile);

  return (
    <div className="flex h-screen bg-background">
      {/* ─── LEFT ICON RAIL (64px) ─── */}
      <div className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-4">
        {/* Logo */}
        <Link href="/" className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-background font-mono text-sm font-bold">
          P
        </Link>

        {/* Nav icons */}
        <div className="flex flex-col items-center gap-1">
          <RailButton
            icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="7" />
                <path d="M10 7v3l2 2" />
              </svg>
            }
            label="Map"
            active
            onClick={() => { setShowSidebar(false); setSelectedPin(null); setSelectedRoommate(null); }}
          />
          <RailButton
            icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="14" height="14" rx="2" />
                <path d="M3 8h14M8 3v14" />
              </svg>
            }
            label="Sidebar"
            active={showSidebar}
            onClick={() => setShowSidebar(!showSidebar)}
          />
          <RailButton
            icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
            label="Add"
            onClick={() => setShowAddModal(true)}
          />
        </div>

        {/* Bottom nav icons */}
        <div className="mt-auto flex flex-col items-center gap-1">
          <Link href="/tracker">
            <RailIconOnly
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1" />
                  <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z" />
                  <path d="M13 12h4M13 16h4" />
                </svg>
              }
              label="Tracker"
            />
          </Link>
          <Link href="/roommates">
            <RailIconOnly
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7" cy="7" r="3" />
                  <circle cx="13" cy="7" r="3" />
                  <path d="M2 17c0-2.5 2-4 5-4s5 1.5 5 4" />
                  <path d="M13 13c2.5 0 5 1.5 5 4" />
                </svg>
              }
              label="Roommates"
            />
          </Link>
          <Link href="/onboarding">
            <RailIconOnly
              icon={
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="10" r="7" />
                  <path d="M10 7v6M8 10h4" />
                </svg>
              }
              label="Setup"
            />
          </Link>
        </div>
      </div>

      {/* ─── SIDEBAR PANEL (320px, togglable) ─── */}
      {showSidebar && (
        <div className="w-80 shrink-0 overflow-y-auto border-r border-border bg-surface">
          <div className="space-y-4 p-4">
            <UnitSummary />

            {/* Map Layers */}
            <div>
              <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-subtle">
                Layers
              </h3>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
                  <input
                    type="checkbox"
                    checked={showListings}
                    onChange={(e) => setShowListings(e.target.checked)}
                    className="accent-primary h-3.5 w-3.5"
                  />
                  Housing listings
                </label>
                {myProfile ? (
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-foreground">
                    <input
                      type="checkbox"
                      checked={roommateLayerOn}
                      onChange={(e) => setShowRoommates(e.target.checked)}
                      className="accent-primary h-3.5 w-3.5"
                    />
                    Roommates ({roommateMatches.length})
                  </label>
                ) : (
                  <div className="rounded-lg border border-dashed border-border-subtle p-2.5">
                    <p className="text-xs text-muted">
                      <Link href="/roommates" className="text-primary underline hover:text-primary-hover">
                        Create a profile
                      </Link>{" "}
                      to see roommates on map.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Roommate toggle */}
            {myProfile && (
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  role="switch"
                  aria-checked={lookingForRoommates}
                  onClick={() => setLookingForRoommates(!lookingForRoommates)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    lookingForRoommates ? "bg-primary" : "bg-border-subtle"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-foreground shadow transition-transform ${
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
                <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-subtle">
                  Filter
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter(opt.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        filter === opt.value
                          ? fitFilterStyle(opt.value)
                          : "bg-surface-elevated text-muted hover:bg-card-hover"
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
              <p className="text-xs text-muted-subtle">
                {filteredPins.length} of {pins.length} listings
              </p>
            )}

            {/* Pin list */}
            {showListings && (
              <div className="space-y-1.5">
                {filteredPins.map((pin) => {
                  const tag = getFitTag(pin);
                  return (
                    <button
                      key={pin.id}
                      onClick={() => handlePinClick(pin)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedPin?.id === pin.id
                          ? "border-primary bg-primary-light"
                          : "border-border bg-card hover:border-border-subtle hover:bg-card-hover"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-foreground">{pin.title}</p>
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
        </div>
      )}

      {/* ─── MAP ─── */}
      <div className="relative flex-1">
        {/* Floating search bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-4 pt-4">
          <div className="pointer-events-auto w-full max-w-md">
            <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface/90 px-4 py-2.5 shadow-lg shadow-black/20 backdrop-blur-md">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted">
                <circle cx="7" cy="7" r="5" />
                <path d="m16 16-3.5-3.5" />
              </svg>
              <span className="text-sm text-muted-subtle">Search listings...</span>
            </div>
          </div>
        </div>

        {/* Filter pills floating (when sidebar is closed) */}
        {!showSidebar && unit && showListings && (
          <div className="pointer-events-none absolute left-0 top-0 z-10 px-4 pt-16">
            <div className="pointer-events-auto flex gap-1.5">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm transition-colors backdrop-blur-sm ${
                    filter === opt.value
                      ? fitFilterStyle(opt.value)
                      : "bg-surface/90 text-muted hover:bg-surface"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

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

      {/* ─── RIGHT DETAILS DRAWER (400px) ─── */}
      {hasDrawerContent && (
        <div className="w-[400px] shrink-0 overflow-y-auto border-l border-border bg-surface">
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
          ) : null}
        </div>
      )}

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

/* ─── HELPER COMPONENTS ─── */

function RailButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-primary-light text-primary"
          : "text-muted hover:bg-surface-elevated hover:text-foreground"
      }`}
    >
      {icon}
    </button>
  );
}

function RailIconOnly({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
    >
      {icon}
    </div>
  );
}

function FitBadge({ tag }: { tag: FitTag }) {
  const styles: Record<FitTag, string> = {
    Great: "bg-fit-great-bg text-fit-great",
    OK: "bg-fit-ok-bg text-fit-ok",
    Conflict: "bg-fit-conflict-bg text-fit-conflict",
  };
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${styles[tag]}`}>
      {tag}
    </span>
  );
}

function fitFilterStyle(value: FilterMode): string {
  switch (value) {
    case "Great":
      return "bg-fit-great-bg text-fit-great ring-1 ring-fit-great/30";
    case "OK":
      return "bg-fit-ok-bg text-fit-ok ring-1 ring-fit-ok/30";
    case "Conflict":
      return "bg-fit-conflict-bg text-fit-conflict ring-1 ring-fit-conflict/30";
    default:
      return "bg-primary-light text-primary ring-1 ring-primary/30";
  }
}
