"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  HousingUnit,
  Pin,
  TrackedPin,
  TrackerStatus,
  FitTag,
  Dealbreaker,
  RoommateProfile,
} from "./types";
import { SEED_PINS } from "./seed-data";
import { SEED_ROOMMATE_PROFILES } from "./roommate-seed";

interface AppState {
  unit: HousingUnit | null;
  pins: Pin[];
  tracked: TrackedPin[];
  roommateProfiles: RoommateProfile[];
  myProfileId: string | null;
  lookingForRoommates: boolean;
  setUnit: (unit: HousingUnit) => void;
  addMemberToUnit: (member: { budgetMin: number; budgetMax: number; dealbreakers: Dealbreaker[] }) => void;
  addPin: (pin: Pin) => void;
  getFitTag: (pin: Pin) => FitTag;
  getFitReasons: (pin: Pin) => { good: string[]; bad: string[] };
  trackPin: (pinId: string, status: TrackerStatus) => void;
  getTrackedStatus: (pinId: string) => TrackerStatus | null;
  getPinById: (pinId: string) => Pin | undefined;
  addRoommateProfile: (profile: RoommateProfile) => void;
  setMyProfileId: (id: string) => void;
  setLookingForRoommates: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

const STORAGE_KEY_UNIT = "pinpoint_unit";
const STORAGE_KEY_TRACKED = "pinpoint_tracked";
const STORAGE_KEY_USER_PINS = "pinpoint_user_pins";
const STORAGE_KEY_PROFILES = "pinpoint_profiles";
const STORAGE_KEY_MY_PROFILE = "pinpoint_my_profile_id";
const STORAGE_KEY_LOOKING = "pinpoint_looking_for_roommates";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnitState] = useState<HousingUnit | null>(null);
  const [tracked, setTracked] = useState<TrackedPin[]>([]);
  const [userPins, setUserPins] = useState<Pin[]>([]);
  const [userProfiles, setUserProfiles] = useState<RoommateProfile[]>([]);
  const [myProfileId, setMyProfileIdState] = useState<string | null>(null);
  const [lookingForRoommates, setLookingState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Merge seeded + user-added pins at runtime
  const pins = useMemo(() => [...SEED_PINS, ...userPins], [userPins]);

  // Merge seeded + user-added roommate profiles
  const roommateProfiles = useMemo(
    () => [...SEED_ROOMMATE_PROFILES, ...userProfiles],
    [userProfiles]
  );

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedUnit = localStorage.getItem(STORAGE_KEY_UNIT);
      if (savedUnit) setUnitState(JSON.parse(savedUnit));
      const savedTracked = localStorage.getItem(STORAGE_KEY_TRACKED);
      if (savedTracked) setTracked(JSON.parse(savedTracked));
      const savedUserPins = localStorage.getItem(STORAGE_KEY_USER_PINS);
      if (savedUserPins) setUserPins(JSON.parse(savedUserPins));
      const savedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (savedProfiles) setUserProfiles(JSON.parse(savedProfiles));
      const savedMyProfile = localStorage.getItem(STORAGE_KEY_MY_PROFILE);
      if (savedMyProfile) setMyProfileIdState(savedMyProfile);
      const savedLooking = localStorage.getItem(STORAGE_KEY_LOOKING);
      if (savedLooking !== null) {
        setLookingState(savedLooking === "true");
      } else {
        // Default: ON if unit exists with exactly 1 member
        const parsedUnit = savedUnit ? JSON.parse(savedUnit) : null;
        setLookingState(!!parsedUnit && parsedUnit.members?.length === 1);
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Persist unit to localStorage
  useEffect(() => {
    if (!hydrated) return;
    if (unit) {
      localStorage.setItem(STORAGE_KEY_UNIT, JSON.stringify(unit));
    } else {
      localStorage.removeItem(STORAGE_KEY_UNIT);
    }
  }, [unit, hydrated]);

  // Persist tracked to localStorage
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY_TRACKED, JSON.stringify(tracked));
  }, [tracked, hydrated]);

  // Persist user-added pins to localStorage
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY_USER_PINS, JSON.stringify(userPins));
  }, [userPins, hydrated]);

  // Persist roommate profiles to localStorage
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(userProfiles));
  }, [userProfiles, hydrated]);

  // Persist my profile id
  useEffect(() => {
    if (!hydrated) return;
    if (myProfileId) {
      localStorage.setItem(STORAGE_KEY_MY_PROFILE, myProfileId);
    } else {
      localStorage.removeItem(STORAGE_KEY_MY_PROFILE);
    }
  }, [myProfileId, hydrated]);

  // Persist lookingForRoommates
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY_LOOKING, String(lookingForRoommates));
  }, [lookingForRoommates, hydrated]);

  const setUnit = useCallback((u: HousingUnit) => {
    setUnitState(u);
  }, []);

  const addMemberToUnit = useCallback(
    (member: { budgetMin: number; budgetMax: number; dealbreakers: Dealbreaker[] }) => {
      setUnitState((prev) => {
        if (!prev) return prev;
        const newMember = {
          id: crypto.randomUUID(),
          ...member,
        };
        const allMembers = [...prev.members, newMember];
        // Recompute constraints: use the tightest budget intersection and union of dealbreakers
        const budgetMin = Math.max(...allMembers.map((m) => m.budgetMin));
        const budgetMax = Math.min(...allMembers.map((m) => m.budgetMax));
        const allDealbreakers = Array.from(
          new Set(allMembers.flatMap((m) => m.dealbreakers))
        ) as Dealbreaker[];
        return {
          ...prev,
          budgetMin,
          budgetMax,
          dealbreakers: allDealbreakers,
          members: allMembers,
        };
      });
    },
    []
  );

  const addPin = useCallback((pin: Pin) => {
    setUserPins((prev) => [...prev, pin]);
  }, []);

  const addRoommateProfile = useCallback((profile: RoommateProfile) => {
    setUserProfiles((prev) => [...prev, profile]);
  }, []);

  const setMyProfileId = useCallback((id: string) => {
    setMyProfileIdState(id);
  }, []);

  const setLookingForRoommates = useCallback((v: boolean) => {
    setLookingState(v);
  }, []);

  const getFitTag = useCallback(
    (pin: Pin): FitTag => {
      if (!unit) return "OK";
      const { good, bad } = computeFit(pin, unit);
      if (bad.length === 0 && good.length > 0) return "Great";
      if (bad.length > 0) return "Conflict";
      return "OK";
    },
    [unit]
  );

  const getFitReasons = useCallback(
    (pin: Pin): { good: string[]; bad: string[] } => {
      if (!unit) return { good: [], bad: [] };
      return computeFit(pin, unit);
    },
    [unit]
  );

  const trackPin = useCallback((pinId: string, status: TrackerStatus) => {
    setTracked((prev) => {
      const existing = prev.findIndex((t) => t.pinId === pinId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], status };
        return updated;
      }
      return [...prev, { pinId, status, addedAt: Date.now() }];
    });
  }, []);

  const getTrackedStatus = useCallback(
    (pinId: string): TrackerStatus | null => {
      return tracked.find((t) => t.pinId === pinId)?.status ?? null;
    },
    [tracked]
  );

  const getPinById = useCallback(
    (pinId: string): Pin | undefined => {
      return pins.find((p) => p.id === pinId);
    },
    [pins]
  );

  return (
    <AppContext.Provider
      value={{
        unit,
        pins,
        tracked,
        roommateProfiles,
        myProfileId,
        lookingForRoommates,
        setUnit,
        addMemberToUnit,
        addPin,
        getFitTag,
        getFitReasons,
        trackPin,
        getTrackedStatus,
        getPinById,
        addRoommateProfile,
        setMyProfileId,
        setLookingForRoommates,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

// --- Fit computation logic ---

function computeFit(
  pin: Pin,
  unit: HousingUnit
): { good: string[]; bad: string[] } {
  const good: string[] = [];
  const bad: string[] = [];

  // Budget check
  if (pin.type === "room") {
    if (pin.rent >= unit.budgetMin && pin.rent <= unit.budgetMax) {
      good.push("Rent is within your budget");
    } else if (pin.rent > unit.budgetMax) {
      bad.push(`Rent ($${pin.rent}) exceeds your max budget ($${unit.budgetMax})`);
    } else {
      good.push("Rent is below your minimum — could be a great deal");
    }
  } else {
    // Whole unit: divide by number of members (or 1)
    const perPerson = Math.round(pin.rent / Math.max(unit.members.length, 1));
    if (perPerson >= unit.budgetMin && perPerson <= unit.budgetMax) {
      good.push(`Split rent (~$${perPerson}/person) fits your budget`);
    } else if (perPerson > unit.budgetMax) {
      bad.push(
        `Split rent (~$${perPerson}/person) exceeds your max budget ($${unit.budgetMax})`
      );
    } else {
      good.push(`Split rent (~$${perPerson}/person) is a great deal`);
    }
  }

  // Move-in date check
  const pinMonth = pin.moveInDate.slice(0, 7); // "2025-09"
  if (pinMonth === unit.moveInMonth) {
    good.push("Move-in date matches perfectly");
  } else {
    bad.push(
      `Move-in is ${pin.moveInDate} but you need ${unit.moveInMonth}`
    );
  }

  // Dealbreaker checks
  if (unit.dealbreakers.includes("pet-free")) {
    if (pin.features.includes("pet-friendly") || pin.features.includes("pet-free")) {
      // pet-free listing = good; pet-friendly means pets may be present = conflict
      if (pin.features.includes("pet-free")) {
        good.push("Pet-free environment");
      } else {
        bad.push("Listing is pet-friendly (you want pet-free)");
      }
    }
  }

  if (unit.dealbreakers.includes("smoking-free")) {
    if (pin.features.includes("smoking-allowed")) {
      bad.push("Smoking is allowed (you want smoke-free)");
    } else if (pin.features.includes("smoking-free")) {
      good.push("Smoke-free environment");
    }
  }

  if (unit.dealbreakers.includes("quiet")) {
    if (pin.features.includes("quiet")) {
      good.push("Quiet environment");
    }
  }

  return { good, bad };
}
