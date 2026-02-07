"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Pin, FitTag } from "@/lib/types";
import { MatchResult } from "@/lib/roommate-match";
import { QUEENS_CAMPUS } from "@/lib/seed-data";

const FIT_COLORS: Record<FitTag, string> = {
  Great: "#10b981",
  OK: "#6366f1",
  Conflict: "#ef4444",
};

// Deterministic position for a roommate profile based on its ID.
// Generates a stable offset around QUEENS_CAMPUS so pins don't stack.
function roommateLatLng(profileId: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < profileId.length; i++) {
    hash = (hash * 31 + profileId.charCodeAt(i)) | 0;
  }
  // Spread ±0.008° around campus (~800m radius)
  const latOff = ((((hash >>> 0) % 1600) - 800) / 100000);
  const lngOff = ((((hash >>> 8) % 1600) - 800) / 100000);
  return [QUEENS_CAMPUS.lat + latOff, QUEENS_CAMPUS.lng + lngOff];
}

export interface MapViewProps {
  pins: Pin[];
  getFitTag: (pin: Pin) => FitTag;
  onPinClick: (pin: Pin) => void;
  selectedPinId?: string;
  // Roommate layer
  showRoommateLayer: boolean;
  roommateMatches: MatchResult[];
  selectedRoommateId?: string | null;
  onRoommateClick: (match: MatchResult) => void;
  // Anchor (You)
  showAnchor: boolean;
}

function createPinIcon(color: string, selected: boolean) {
  const size = selected ? 16 : 12;
  const border = selected ? 3 : 2;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${border}px solid white;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
      ${selected ? "transform:scale(1.3);" : ""}
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createCampusIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:32px;height:32px;
      background:#6366f1;color:white;
      border-radius:8px;font-size:16px;font-weight:bold;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
      border:2px solid white;
    ">Q</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function createAnchorIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;
      background:#10b981;color:white;
      border-radius:50%;font-size:12px;font-weight:bold;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
      border:2px solid white;
    ">You</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createRoommateIcon(initial: string, selected: boolean, score: number) {
  const size = selected ? 26 : 22;
  const border = selected ? 3 : 2;
  const bg = score >= 80 ? "#10b981" : score >= 60 ? "#6366f1" : "#9ca3af";
  return L.divIcon({
    className: "",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;
      background:${bg};color:white;
      border:${border}px solid white;
      border-radius:50%;
      font-size:10px;font-weight:bold;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
      ${selected ? "transform:scale(1.15);" : ""}
    ">${initial}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function getLineColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#6366f1";
  return "#9ca3af";
}

export default function MapView({
  pins,
  getFitTag,
  onPinClick,
  selectedPinId,
  showRoommateLayer,
  roommateMatches,
  selectedRoommateId,
  onRoommateClick,
  showAnchor,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const roommateMarkersRef = useRef<L.Marker[]>([]);
  const anchorMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [QUEENS_CAMPUS.lat, QUEENS_CAMPUS.lng],
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Queen's campus marker
    L.marker([QUEENS_CAMPUS.lat, QUEENS_CAMPUS.lng], {
      icon: createCampusIcon(),
    })
      .bindTooltip("Queen's University", {
        direction: "top",
        offset: [0, -20],
      })
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update listing markers when pins or selection changes
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    pins.forEach((pin) => {
      const tag = getFitTag(pin);
      const isSelected = pin.id === selectedPinId;
      const marker = L.marker([pin.lat, pin.lng], {
        icon: createPinIcon(FIT_COLORS[tag], isSelected),
      })
        .bindTooltip(
          `<b>${pin.title}</b><br/>$${pin.rent}/mo · ${tag}`,
          { direction: "top", offset: [0, -10] }
        )
        .on("click", () => onPinClick(pin))
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [pins, getFitTag, onPinClick, selectedPinId]);

  // Update roommate markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old roommate markers
    roommateMarkersRef.current.forEach((m) => m.remove());
    roommateMarkersRef.current = [];

    if (!showRoommateLayer) return;

    roommateMatches.forEach((match) => {
      const [lat, lng] = roommateLatLng(match.profile.id);
      const initial = match.profile.name.charAt(0).toUpperCase();
      const isSelected = match.profile.id === selectedRoommateId;
      const marker = L.marker([lat, lng], {
        icon: createRoommateIcon(initial, isSelected, match.score),
      })
        .bindTooltip(
          `<b>${match.profile.name}</b><br/>${match.score}% match`,
          { direction: "top", offset: [0, -10] }
        )
        .on("click", () => onRoommateClick(match))
        .addTo(mapRef.current!);
      roommateMarkersRef.current.push(marker);
    });
  }, [showRoommateLayer, roommateMatches, selectedRoommateId, onRoommateClick]);

  // Anchor pin (You)
  useEffect(() => {
    if (!mapRef.current) return;

    if (anchorMarkerRef.current) {
      anchorMarkerRef.current.remove();
      anchorMarkerRef.current = null;
    }

    if (!showAnchor || !showRoommateLayer) return;

    const anchor = L.marker([QUEENS_CAMPUS.lat, QUEENS_CAMPUS.lng], {
      icon: createAnchorIcon(),
      zIndexOffset: 1000,
    })
      .bindTooltip("You / Your Unit", {
        direction: "top",
        offset: [0, -16],
      })
      .addTo(mapRef.current);
    anchorMarkerRef.current = anchor;
  }, [showAnchor, showRoommateLayer]);

  // Connection polyline: anchor -> selected roommate
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old line
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (!showRoommateLayer || !selectedRoommateId) return;

    const selectedMatch = roommateMatches.find(
      (m) => m.profile.id === selectedRoommateId
    );
    if (!selectedMatch) return;

    const [rLat, rLng] = roommateLatLng(selectedMatch.profile.id);
    const color = getLineColor(selectedMatch.score);

    const line = L.polyline(
      [
        [QUEENS_CAMPUS.lat, QUEENS_CAMPUS.lng],
        [rLat, rLng],
      ],
      {
        color,
        weight: 2,
        opacity: 0.5,
        dashArray: "6 4",
      }
    ).addTo(mapRef.current);

    polylineRef.current = line;
  }, [showRoommateLayer, selectedRoommateId, roommateMatches]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: "100%" }}
    />
  );
}
