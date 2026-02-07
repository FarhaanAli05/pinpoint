"use client";

import { useState } from "react";
import { Pin, PinType } from "@/lib/types";
import { useApp } from "@/lib/context";

interface AddListingModalProps {
  onClose: () => void;
  onAdded: (pin: Pin) => void;
}

type Step = "input" | "confirm";

const FEATURE_OPTIONS = [
  { value: "quiet", label: "Quiet" },
  { value: "pet-friendly", label: "Pet-friendly" },
  { value: "pet-free", label: "Pet-free" },
  { value: "smoking-free", label: "Smoke-free" },
  { value: "smoking-allowed", label: "Smoking allowed" },
  { value: "laundry", label: "Laundry" },
  { value: "parking", label: "Parking" },
  { value: "furnished", label: "Furnished" },
];

// Preset neighborhood locations near Queen's
const LOCATION_PRESETS = [
  { label: "Near Queen's Campus", lat: 44.2253, lng: -76.4951 },
  { label: "West End / Portsmouth", lat: 44.2280, lng: -76.5100 },
  { label: "Downtown Kingston", lat: 44.2312, lng: -76.4860 },
  { label: "Williamsville / North", lat: 44.2380, lng: -76.4920 },
] as const;

export function AddListingModal({ onClose, onAdded }: AddListingModalProps) {
  const { unit, addPin } = useApp();

  // Step 1 state
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parseSuccess, setParseSuccess] = useState(false);

  // Step 2 (confirm) state — fields the user can edit
  const [title, setTitle] = useState("");
  const [rent, setRent] = useState("");
  const [address, setAddress] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [description, setDescription] = useState("");
  const [bedrooms, setBedrooms] = useState("1");
  const [pinType, setPinType] = useState<PinType>("room");
  const [features, setFeatures] = useState<string[]>([]);
  const [sourceLabel, setSourceLabel] = useState("");

  // Location selection
  const [locationMode, setLocationMode] = useState<"preset" | "drop">("preset");
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [dropLat, setDropLat] = useState("");
  const [dropLng, setDropLng] = useState("");

  const [submitting, setSubmitting] = useState(false);

  async function handleParseUrl() {
    if (!url.trim()) {
      setManualMode(true);
      setStep("confirm");
      return;
    }

    setParsing(true);
    setParseError("");
    setParseSuccess(false);

    try {
      const res = await fetch("/api/parse-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) throw new Error("Failed to parse");

      const data = await res.json();

      // Track how many fields we could auto-fill
      let filledCount = 0;

      if (data.title) { setTitle(data.title); filledCount++; }
      if (data.rent) { setRent(String(data.rent)); filledCount++; }
      if (data.moveInDate) { setMoveInDate(data.moveInDate); filledCount++; }
      if (data.sourceLabel) setSourceLabel(data.sourceLabel);
      if (data.addressText) { setAddress(data.addressText); filledCount++; }
      if (data.description) { setDescription(data.description); filledCount++; }
      if (data.bedrooms) { setBedrooms(String(data.bedrooms)); filledCount++; }
      if (data.furnished === true) {
        setFeatures((prev) => prev.includes("furnished") ? prev : [...prev, "furnished"]);
      }
      if (data.features?.length) {
        // Map parsed features to our known feature set where possible
        const mapped: string[] = [];
        for (const f of data.features as string[]) {
          const lower = f.toLowerCase();
          if (lower.includes("laundry")) mapped.push("laundry");
          else if (lower.includes("parking")) mapped.push("parking");
          else if (lower.includes("quiet")) mapped.push("quiet");
          else if (lower.includes("furnish")) mapped.push("furnished");
          else if (lower.includes("pet") && lower.includes("friendly")) mapped.push("pet-friendly");
          else if (lower.includes("pet") && lower.includes("free")) mapped.push("pet-free");
          else if (lower.includes("smoke") && lower.includes("free")) mapped.push("smoking-free");
          else if (lower.includes("smok") && lower.includes("allow")) mapped.push("smoking-allowed");
        }
        if (mapped.length) {
          setFeatures((prev) => Array.from(new Set([...prev, ...mapped])));
          filledCount++;
        }
      }

      if (filledCount > 0) {
        setParseSuccess(true);
      } else {
        setParseError("Couldn't extract details — please enter them below.");
      }

      setStep("confirm");
    } catch {
      setParseError("Couldn't extract details — please enter them below.");
      setStep("confirm");
    } finally {
      setParsing(false);
    }
  }

  function toggleFeature(feat: string) {
    setFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  }

  function getCoordinates(): { lat: number; lng: number } {
    if (locationMode === "drop" && dropLat && dropLng) {
      const lat = parseFloat(dropLat);
      const lng = parseFloat(dropLng);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    // Use preset with small jitter so multiple pins don't stack
    const preset = LOCATION_PRESETS[selectedPreset];
    const jitterLat = (Math.random() - 0.5) * 0.004;
    const jitterLng = (Math.random() - 0.5) * 0.006;
    return { lat: preset.lat + jitterLat, lng: preset.lng + jitterLng };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const coords = getCoordinates();

    const pin: Pin = {
      id: `user-${crypto.randomUUID()}`,
      lat: coords.lat,
      lng: coords.lng,
      rent: Number(rent) || 0,
      moveInDate: moveInDate || "2025-09-01",
      type: pinType,
      title: title || "Untitled listing",
      description: description || "",
      address: address || "Kingston, ON",
      bedrooms: Number(bedrooms) || 1,
      features,
      externalLink: url.trim() || undefined,
      sourceType: "user-added",
      sourceLabel: sourceLabel || (url.trim() ? "External link" : undefined),
      addedByUnitId: unit?.id,
      createdAt: Date.now(),
    };

    addPin(pin);
    onAdded(pin);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold">
            {step === "input" ? "Add a Listing" : "Confirm Details"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-border hover:text-foreground"
            aria-label="Close"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" />
            </svg>
          </button>
        </div>

        {/* Step 1: URL input */}
        {step === "input" && (
          <div className="space-y-4 p-5">
            <p className="text-sm text-muted">
              Paste a listing URL from Facebook Marketplace, Kijiji, or any housing site.
              Pinpoint will try to extract details for you.
            </p>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
                Listing URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://facebook.com/marketplace/item/..."
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>

            {parseError && (
              <p className="text-xs text-red-600">{parseError}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleParseUrl}
                disabled={parsing}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {parsing ? "Fetching details..." : url.trim() ? "Auto-fill from URL" : "Skip — Enter Manually"}
              </button>
            </div>

            <button
              onClick={() => {
                setManualMode(true);
                setStep("confirm");
              }}
              className="w-full text-center text-xs text-muted underline hover:text-primary"
            >
              I&apos;ll enter details manually
            </button>

            <p className="text-xs text-muted/70">
              Pinpoint does not own or host these listings. You&apos;re bookmarking an
              external source for your group.
            </p>
          </div>
        )}

        {/* Step 2: Confirm / Manual entry */}
        {step === "confirm" && (
          <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-5">
            {parseSuccess && (
              <p className="mb-3 rounded-lg bg-green-50 p-2 text-xs text-green-700">
                Auto-filled from {sourceLabel || "URL"}. Review and edit as needed.
              </p>
            )}
            {parseError && (
              <p className="mb-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
                {parseError}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 2BR apartment near campus"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
                    Rent ($/mo) *
                  </label>
                  <input
                    type="number"
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    placeholder="1200"
                    min="0"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
                    Move-in Date
                  </label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 123 University Ave, Kingston"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Location picker */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
                  Pin Location
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setLocationMode("preset")}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      locationMode === "preset"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-muted hover:bg-gray-200"
                    }`}
                  >
                    Choose area
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode("drop")}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      locationMode === "drop"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-muted hover:bg-gray-200"
                    }`}
                  >
                    Enter coordinates
                  </button>
                </div>

                {locationMode === "preset" ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {LOCATION_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPreset(idx)}
                        className={`rounded-lg border px-2.5 py-2 text-xs text-left transition-colors ${
                          selectedPreset === idx
                            ? "border-primary bg-primary-light text-primary font-medium"
                            : "border-border text-muted hover:border-primary/30"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={dropLat}
                      onChange={(e) => setDropLat(e.target.value)}
                      placeholder="Latitude (e.g. 44.225)"
                      className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={dropLng}
                      onChange={(e) => setDropLng(e.target.value)}
                      placeholder="Longitude (e.g. -76.495)"
                      className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="col-span-2 text-xs text-muted/70">
                      Tip: Right-click on Google Maps to copy coordinates
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
                    Type
                  </label>
                  <select
                    value={pinType}
                    onChange={(e) => setPinType(e.target.value as PinType)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="room">Room</option>
                    <option value="whole-unit">Whole Unit</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    min="1"
                    max="10"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes about this listing..."
                  rows={2}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
                  Features
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FEATURE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleFeature(opt.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        features.includes(opt.value)
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-muted hover:bg-gray-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {url.trim() && !manualMode && (
                <div className="rounded-lg bg-gray-50 p-2.5">
                  <p className="text-xs text-muted">
                    <span className="font-semibold">Source:</span>{" "}
                    {sourceLabel || "External link"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted/70">{url}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep("input");
                  setParseError("");
                  setParseSuccess(false);
                }}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !rent}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add to Map"}
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-muted/70">
              This listing will be visible to your housing unit.
              Pinpoint does not own or verify external listings.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
