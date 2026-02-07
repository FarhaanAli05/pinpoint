"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Pin, ListingCategory } from "@/lib/types";
import { QUEENS_CAMPUS } from "@/lib/seed-data";
import { useTheme } from "@/lib/theme";

const CATEGORY_LABELS: Record<ListingCategory, string> = {
  sublet: "Sublet",
  "share-listing": "Share listing",
  "looking-for-roommates": "Looking for roommates",
  "looking-for-room-and-roommate": "Looking for room + roommate",
  "have-room-need-roommates": "Have room, need people",
  "sublet-room": "Subletting a room",
};

/** Glow is subtle: small blur, low opacity. "Me" pin: yellow + person style. */
function getGlowDotStyle(category: ListingCategory, selected: boolean, isMe?: boolean): { bg: string; glow: string; size: number; isMe?: boolean } {
  if (isMe) {
    const scale = selected ? 1.2 : 1;
    const size = Math.round(14 * scale);
    return { bg: "#eab308", glow: "rgba(234,179,8,0.45)", size, isMe: true };
  }
  const scale = selected ? 1.2 : 1;
  const size = Math.round(12 * scale);
  if (category === "looking-for-roommates" || category === "looking-for-room-and-roommate") {
    return { bg: "#ef4444", glow: "rgba(239,68,68,0.35)", size };
  }
  if (category === "have-room-need-roommates") {
    return { bg: "#3b82f6", glow: "rgba(59,130,246,0.35)", size };
  }
  if (category === "sublet-room") {
    return { bg: "#8b5cf6", glow: "rgba(139,92,246,0.35)", size };
  }
  if (category === "sublet") {
    return { bg: "#22c55e", glow: "rgba(34,197,94,0.35)", size };
  }
  return { bg: "#14b8a6", glow: "rgba(20,184,166,0.35)", size };
}

interface MapViewProps {
  pins: Pin[];
  onPinClick: (pin: Pin) => void;
  selectedPinId?: string | null;
  /** Double-click on map to add yourself here */
  onMapDoubleClick?: (lat: number, lng: number) => void;
  /** Center map on this point (e.g. user's chosen area from onboarding) */
  initialCenter?: { lat: number; lng: number };
  /** Animate zoom-in to initialCenter when provided */
  animateZoom?: boolean;
  /** When true, fit map bounds to show all pins (with padding) */
  fitBoundsToPins?: boolean;
  /** When set, fly map to this center (e.g. after search) */
  flyToCenter?: { lat: number; lng: number } | null;
}

function createPinIcon(category: ListingCategory, selected: boolean, _isDark: boolean, isMe?: boolean) {
  const { bg, glow, size, isMe: meStyle } = getGlowDotStyle(category, selected, isMe);
  const total = size + 8;
  const blur = 4;
  const spread = 2;
  const html = `<div style="
    width:${total}px;height:${total}px;
    display:flex;align-items:center;justify-content:center;
  ">
    <span style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${bg};
      box-shadow: 0 0 ${blur}px ${spread}px ${glow};
      border:2px solid rgba(255,255,255,0.9);
      ${meStyle ? "font-size:10px;line-height:1;display:flex;align-items:center;justify-content:center;color:#1c1917;" : ""}
    ">${meStyle ? "me" : ""}</span>
  </div>`;
  return L.divIcon({
    className: "",
    html,
    iconSize: [total, total],
    iconAnchor: [total / 2, total / 2],
  });
}

export default function MapView({
  pins,
  onPinClick,
  selectedPinId,
  onMapDoubleClick,
  initialCenter,
  animateZoom = false,
  fitBoundsToPins = false,
  flyToCenter,
}: MapViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const onDoubleClickRef = useRef(onMapDoubleClick);
  onDoubleClickRef.current = onMapDoubleClick;
  const center = initialCenter ?? QUEENS_CAMPUS;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const startZoom = animateZoom ? 13 : 15;
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: startZoom,
      zoomControl: true,
    });

    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    const layer = L.tileLayer(tileUrl, {
      attribution: "&copy; OpenStreetMap, &copy; CARTO",
    }).addTo(map);
    tileLayerRef.current = layer;

    if (onDoubleClickRef.current) {
      map.on("dblclick", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        onDoubleClickRef.current?.(lat, lng);
      });
    }

    mapRef.current = map;

    if (animateZoom) {
      const t = setTimeout(() => {
        map.flyTo([center.lat, center.lng], 15, { duration: 0.8 });
      }, 100);
      return () => {
        clearTimeout(t);
        map.remove();
        mapRef.current = null;
      };
    }

    return () => {
      tileLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [center.lat, center.lng, animateZoom]);

  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const map = mapRef.current;
    tileLayerRef.current.remove();
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    const layer = L.tileLayer(tileUrl, {
      attribution: "&copy; OpenStreetMap, &copy; CARTO",
    }).addTo(map);
    tileLayerRef.current = layer;
  }, [isDark]);

  useEffect(() => {
    if (!mapRef.current || !flyToCenter) return;
    mapRef.current.flyTo([flyToCenter.lat, flyToCenter.lng], 15, { duration: 0.6 });
  }, [flyToCenter?.lat, flyToCenter?.lng]);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const tooltipBg = isDark ? "#18181b" : "#f4f4f5";
    const tooltipBorder = isDark ? "#27272a" : "#e4e4e7";
    const tooltipTitle = isDark ? "#fafafa" : "#18181b";
    const tooltipSub = isDark ? "#a1a1aa" : "#52525b";

    pins.forEach((pin) => {
      const isSelected = pin.id === selectedPinId;
      const isMe = !!pin.isMe;
      const marker = L.marker([pin.lat, pin.lng], {
        icon: createPinIcon(pin.category, isSelected, isDark, isMe),
      })
        .bindTooltip(
          `<b style="color:${tooltipTitle}">${pin.title}</b><br/><span style="color:${tooltipSub}">${isMe ? "You (pinned location)" : `${CATEGORY_LABELS[pin.category]} · $${pin.rent}/mo`}</span>`,
          { direction: "top", offset: [0, -12], className: "!border !text-left" }
        )
        .on("click", () => onPinClick(pin))
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    if (fitBoundsToPins && pins.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [pins, onPinClick, selectedPinId, isDark, fitBoundsToPins]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: "100%" }}
    />
  );
}
