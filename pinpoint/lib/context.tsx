"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { Pin } from "./types";
import { SEED_PINS } from "./seed-data";

const STORAGE_KEY_USER_PINS = "pinpoint_user_pins";

interface AppState {
  pins: Pin[];
  addPin: (pin: Pin) => void;
  getPinById: (pinId: string) => Pin | undefined;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userPins, setUserPins] = useState<Pin[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER_PINS);
      if (raw) {
        const parsed = JSON.parse(raw) as Pin[];
        if (Array.isArray(parsed)) setUserPins(parsed);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_USER_PINS, JSON.stringify(userPins));
    } catch {
      // ignore
    }
  }, [userPins, hydrated]);

  const pins = useMemo(() => [...SEED_PINS, ...userPins], [userPins]);

  const addPin = useCallback((pin: Pin) => {
    setUserPins((prev) => [...prev, pin]);
  }, []);

  const getPinById = useCallback(
    (pinId: string) => pins.find((p) => p.id === pinId),
    [pins]
  );

  return (
    <AppContext.Provider value={{ pins, addPin, getPinById }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
