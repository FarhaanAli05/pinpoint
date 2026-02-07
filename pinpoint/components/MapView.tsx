"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Pin, FitTag } from "@/lib/types";
import { MatchResult } from "@/lib/roommate-match";
import { QUEENS_CAMPUS } from "@/lib/seed-data";

const FIT_COLORS: Record<FitTag, string> = {
  Great: "#34d399",
  OK: "#818cf8",
  Conflict: "#f87171",
};

function roommateLatLng(profileId: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < profileId.length; i++) {
    hash = (hash * 31 + profileId.charCodeAt(i)) | 0;
  }
  const latOff = ((((hash >>> 0) % 1600) - 800) / 100000);
  const lngOff = ((((hash >>> 8) % 1600) - 800) / 100000);
  return [QUEENS_CAMPUS.lat + latOff, QUEENS_CAMPUS.lng + lngOff];
}

export interface MapViewProps {
  pins: Pin[];
  getFitTag: (pin: Pin) => FitTag;
  onPinClick: (pin: Pin) => void;
  selectedPinId?: string;
  showRoommateLayer: boolean;
  roommateMatches: MatchResult[];
  selectedRoommateId?: string | null;
  onRoommateClick: (match: MatchResult) => void;
  showAnchor: boolean;
}

function createPinIcon(color: string, selected: boolean) {
  const size = selected ? 20 : 14;
  const strokeWidth = selected ? 3 : 2;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${strokeWidth}px solid rgba(255,255,255,0.9);
      border-radius:50%;
      box-shadow:0 0 ${selected ? '12' : '6'}px ${color}80, 0 2px 4px rgba(0,0,0,0.4);
      ${selected ? "transform:scale(1.2);" : ""}
      transition: transform 150ms ease-out, box-shadow 150ms ease-out;
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
      background:#818cf8;color:#09090b;
      border-radius:8px;font-size:14px;font-weight:bold;
      box-shadow:0 0 12px rgba(129,140,248,0.4), 0 2px 6px rgba(0,0,0,0.4);
      border:2px solid rgba(255,255,255,0.8);
      font-family:var(--font-geist-mono),monospace;
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
      background:#34d399;color:#09090b;
      border-radius:50%;font-size:10px;font-weight:bold;
      box-shadow:0 0 10px rgba(52,211,153,0.4), 0 2px 6px rgba(0,0,0,0.4);
      border:2px solid rgba(255,255,255,0.8);
      font-family:var(--font-geist-mono),monospace;
    ">You</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createRoommateIcon(initial: string, selected: boolean, score: number) {
  const size = selected ? 26 : 22;
  const strokeWidth = selected ? 3 : 2;
  const bg = score >= 80 ? "#34d399" : score >= 60 ? "#818cf8" : "#71717a";
  return L.divIcon({
    className: "",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;
      background:${bg};color:#09090b;
      border:${strokeWidth}px solid rgba(255,255,255,0.8);
      border-radius:50%;
      font-size:10px;font-weight:bold;
      box-shadow:0 0 ${selected ? '10' : '4'}px ${bg}60, 0 2px 4px rgba(0,0,0,0.4);
      ${selected ? "transform:scale(1.1);" : ""}
      font-family:var(--font-geist-mono),monospace;
    ">${initial}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function getLineColor(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#818cf8";
  return "#71717a";
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

    // Dark tile layer (CartoDB Dark Matter)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
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

  // Update listing markers
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

  // Connection polyline
  useEffect(() => {
    if (!mapRef.current) return;

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
        opacity: 0.4,
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
