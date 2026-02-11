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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Glow is subtle: small blur, low opacity. "Me" pin: yellow + person style. */
function getGlowDotStyle(category: ListingCategory, selected: boolean, isMe?: boolean, uniformColor?: boolean): { bg: string; glow: string; size: number; isMe?: boolean } {
  if (isMe) {
    const scale = selected ? 1.2 : 1;
    const size = Math.round(14 * scale);
    return { bg: "#eab308", glow: "rgba(234,179,8,0.45)", size, isMe: true };
  }
  const scale = selected ? 1.2 : 1;
  const size = Math.round(12 * scale);
  if (uniformColor) {
    return { bg: "#14b8a6", glow: "rgba(20,184,166,0.35)", size };
  }
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
  /** Click on map (not on a marker) — e.g. close detail panel and boundaries */
  onMapClick?: () => void;
  /** Center map on this point (e.g. user's chosen area from onboarding) */
  initialCenter?: { lat: number; lng: number };
  /** Animate zoom-in to initialCenter when provided */
  animateZoom?: boolean;
  /** When true, fit map bounds to show all pins (with padding) */
  fitBoundsToPins?: boolean;
  /** When set, fly map to this center (e.g. after search) */
  flyToCenter?: { lat: number; lng: number } | null;
  /** When true, use a single color for all pins (listings view, not roommate categories) */
  uniformPinColor?: boolean;
  /** Callback when map is ready, provides zoom control methods */
  onMapReady?: (controls: { zoomIn: () => void; zoomOut: () => void }) => void;
}

function createPinIcon(category: ListingCategory, selected: boolean, _isDark: boolean, isMe?: boolean, uniformColor?: boolean) {
  const { bg, glow, size, isMe: meStyle } = getGlowDotStyle(category, selected, isMe, uniformColor);
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
    className: "pin-marker-icon",
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
  onMapClick,
  initialCenter,
  animateZoom = false,
  fitBoundsToPins = false,
  flyToCenter,
  uniformPinColor = false,
  onMapReady,
}: MapViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const prevPinsRef = useRef<Pin[]>([]);
  const boundaryLayerRef = useRef<L.Polygon | null>(null);
  const rippleLayersRef = useRef<L.Circle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const onDoubleClickRef = useRef(onMapDoubleClick);
  const onMapClickRef = useRef(onMapClick);
  const prevSelectedPinIdRef = useRef<string | null | undefined>(null);
  onDoubleClickRef.current = onMapDoubleClick;
  onMapClickRef.current = onMapClick;
  const center = initialCenter ?? QUEENS_CAMPUS;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const startZoom = animateZoom ? 13 : 15;
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: startZoom,
      zoomControl: false, // Disable default zoom controls - we'll add custom ones
      attributionControl: false,
    });

    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    const layer = L.tileLayer(tileUrl, {}).addTo(map);
    tileLayerRef.current = layer;

    if (onDoubleClickRef.current) {
      map.on("dblclick", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        onDoubleClickRef.current?.(lat, lng);
      });
    }
    map.on("click", () => {
      onMapClickRef.current?.();
    });

    mapRef.current = map;

    // Expose zoom controls to parent
    if (onMapReady) {
      onMapReady({
        zoomIn: () => map.zoomIn(),
        zoomOut: () => map.zoomOut(),
      });
    }

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
      // Clean up ripples
      rippleLayersRef.current.forEach((circle) => {
        try {
          if (map.hasLayer(circle)) circle.remove();
        } catch {}
      });
      rippleLayersRef.current = [];
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
    const layer = L.tileLayer(tileUrl, {}).addTo(map);
    tileLayerRef.current = layer;
  }, [isDark]);

  useEffect(() => {
    if (!mapRef.current || !flyToCenter) return;
    mapRef.current.flyTo([flyToCenter.lat, flyToCenter.lng], 15, { duration: 0.6 });
  }, [flyToCenter?.lat, flyToCenter?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const prevPins = prevPinsRef.current;
    const pinsChanged =
      prevPins.length !== pins.length || pins.some((p, i) => p.id !== prevPins[i]?.id);
    prevPinsRef.current = pins;

    if (pinsChanged) {
      const toRemove = markersByIdRef.current;
      markersByIdRef.current = new Map();
      toRemove.forEach((m) => {
        try {
          m.off();
          m.unbindTooltip?.();
          m.closeTooltip?.();
          if (map.hasLayer(m)) m.remove();
        } catch (_) {}
      });

      pins.forEach((pin) => {
        const isSelected = pin.id === selectedPinId;
        const isMe = !!pin.isMe;
        const marker = L.marker([pin.lat, pin.lng], {
          icon: createPinIcon(pin.category, isSelected, isDark, isMe, uniformPinColor),
        })
          .bindTooltip(
            `<div class="pin-tooltip__inner"><span class="pin-tooltip__title">${escapeHtml(pin.title)}</span><span class="pin-tooltip__sub">${escapeHtml(isMe ? "You (pinned location)" : `${CATEGORY_LABELS[pin.category]} · $${pin.rent}/mo`)}</span></div>`,
            { direction: "top", offset: [0, -14], className: `pin-tooltip pin-tooltip--${isDark ? "dark" : "light"}`, sticky: true }
          )
          .on("click", (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e.originalEvent);
            onPinClick(pin);
          })
          .addTo(map);
        markersByIdRef.current.set(pin.id, marker);
      });
    } else {
      pins.forEach((pin) => {
        const marker = markersByIdRef.current.get(pin.id);
        if (marker) {
          const isSelected = pin.id === selectedPinId;
          const isMe = !!pin.isMe;
          marker.setIcon(createPinIcon(pin.category, isSelected, isDark, isMe, uniformPinColor));
        }
      });
    }

    // Clean up previous boundary
    const boundary = boundaryLayerRef.current;
    if (boundary && map.hasLayer(boundary)) {
      boundary.remove();
    }
    boundaryLayerRef.current = null;

    // Clean up previous ripples
    rippleLayersRef.current.forEach((circle) => {
      if (map.hasLayer(circle)) circle.remove();
    });
    rippleLayersRef.current = [];

    const selectedPin = selectedPinId ? pins.find((p) => p.id === selectedPinId) : null;
    const pinJustSelected = selectedPinId !== prevSelectedPinIdRef.current && selectedPinId != null;
    prevSelectedPinIdRef.current = selectedPinId;

    if (selectedPin?.boundary?.length) {
      // Make boundary more circular by approximating as a circle
      const originalPoints = selectedPin.boundary.map(([lat, lng]) => L.latLng(lat, lng));
      const center = L.latLng(selectedPin.lat, selectedPin.lng);
      
      // Calculate average radius from center to all boundary points
      let totalDistance = 0;
      originalPoints.forEach((point) => {
        totalDistance += center.distanceTo(point);
      });
      const avgRadius = totalDistance / originalPoints.length;
      
      // Generate a circular boundary with many points (64 points for smooth circle)
      const smoothedPoints: L.LatLng[] = [];
      const numPoints = 64;
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        // Convert radius (meters) to lat/lng offset
        // 1 degree lat ≈ 111km, 1 degree lng ≈ 111km * cos(lat)
        const latOffset = (avgRadius / 111000) * Math.cos(angle);
        const lngOffset = (avgRadius / (111000 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angle);
        smoothedPoints.push(L.latLng(center.lat + latOffset, center.lng + lngOffset));
      }
      
      const fill = isDark ? "rgba(20,184,166,0.12)" : "rgba(20,184,166,0.15)";
      const stroke = isDark ? "rgba(20,184,166,0.5)" : "rgba(20,184,166,0.55)";
      
      // Create boundary polygon with smoothed points
      const polygon = L.polygon(smoothedPoints, {
        color: stroke,
        weight: 2,
        fillColor: fill,
        fillOpacity: 1,
        smoothFactor: 0, // No simplification - use all points for smoothness
      }).addTo(map);
      boundaryLayerRef.current = polygon;

      // Create ripple effect when pin is clicked - single circle that stays within boundary
      if (pinJustSelected) {
        const center = L.latLng(selectedPin.lat, selectedPin.lng);
        const bounds = L.latLngBounds(smoothedPoints);
        
        // Calculate the maximum distance from center to any boundary point
        let maxDistance = 0;
        smoothedPoints.forEach((point) => {
          const distance = center.distanceTo(point);
          if (distance > maxDistance) maxDistance = distance;
        });
        
        // Use full boundary radius for the circle
        const maxRadius = maxDistance;
        const baseRadius = maxRadius * 0.05; // Start very small
        
        setTimeout(() => {
          if (!mapRef.current || selectedPinId !== selectedPin.id) return;
          
          const rippleColor = isDark ? "rgba(20,184,166,0.5)" : "rgba(20,184,166,0.6)";
          const circle = L.circle(center, {
            radius: baseRadius,
            color: rippleColor,
            weight: 2.5,
            fillColor: rippleColor,
            fillOpacity: 0.2,
            opacity: 0.6,
          }).addTo(map);
          
          rippleLayersRef.current.push(circle);
          
          // Phase 1: Quickly expand to full boundary radius (no fade)
          const expandDuration = 250; // 250ms quick expansion
          const fadeDuration = 1200; // 1.2 second fade
          const startTime = Date.now();
          const initialRadius = baseRadius;
          
          const animate = () => {
            const currentMap = mapRef.current;
            const currentSelectedId = selectedPinId;
            
            if (!currentMap || currentSelectedId !== selectedPin.id) {
              try {
                if (map.hasLayer(circle)) circle.remove();
              } catch {}
              rippleLayersRef.current = rippleLayersRef.current.filter((c) => c !== circle);
              return;
            }
            
            const elapsed = Date.now() - startTime;
            
            if (elapsed < expandDuration) {
              // Phase 1: Quick expansion to full radius (no fade)
              const expandProgress = Math.min(elapsed / expandDuration, 1);
              const easeOut = 1 - Math.pow(1 - expandProgress, 2); // Ease-out quadratic
              const currentRadius = initialRadius + (maxRadius - initialRadius) * easeOut;
              
              try {
                circle.setRadius(currentRadius);
                // Keep full opacity during expansion
                circle.setStyle({
                  fillOpacity: 0.2,
                  opacity: 0.6,
                });
              } catch (e) {
                rippleLayersRef.current = rippleLayersRef.current.filter((c) => c !== circle);
                return;
              }
              
              requestAnimationFrame(animate);
            } else {
              // Phase 2: Fade out at full radius
              const fadeElapsed = elapsed - expandDuration;
              const fadeProgress = Math.min(fadeElapsed / fadeDuration, 1);
              const currentOpacity = 0.6 * (1 - fadeProgress);
              
              try {
                circle.setRadius(maxRadius); // Keep at full radius
                circle.setStyle({
                  fillOpacity: currentOpacity * 0.33,
                  opacity: currentOpacity,
                });
              } catch (e) {
                rippleLayersRef.current = rippleLayersRef.current.filter((c) => c !== circle);
                return;
              }
              
              if (fadeProgress < 1) {
                requestAnimationFrame(animate);
              } else {
                try {
                  if (map.hasLayer(circle)) circle.remove();
                } catch {}
                rippleLayersRef.current = rippleLayersRef.current.filter((c) => c !== circle);
              }
            }
          };
          
          requestAnimationFrame(animate);
        }, 0);
      }
    }
  }, [pins, onPinClick, selectedPinId, isDark, uniformPinColor]);

  useEffect(() => {
    if (!mapRef.current || !fitBoundsToPins || pins.length === 0) return;
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
    mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [pins, fitBoundsToPins]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: "100%" }}
    />
  );
}
