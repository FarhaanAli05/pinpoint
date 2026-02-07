"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Pin, FitTag } from "@/lib/types";
import { QUEENS_CAMPUS } from "@/lib/seed-data";

const FIT_COLORS: Record<FitTag, string> = {
  Great: "#10b981",
  OK: "#6366f1",
  Conflict: "#ef4444",
};

interface MapViewProps {
  pins: Pin[];
  getFitTag: (pin: Pin) => FitTag;
  onPinClick: (pin: Pin) => void;
  selectedPinId?: string;
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

export default function MapView({
  pins,
  getFitTag,
  onPinClick,
  selectedPinId,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
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
      .bindTooltip("Queen's University", { direction: "top", offset: [0, -20] })
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when pins or selection changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
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

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: "100%" }}
    />
  );
}
