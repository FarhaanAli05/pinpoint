import type { Pin } from "./types";
import type { UserIntent } from "./types";
import { filterPinsByIntent } from "./filter-by-intent";

const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  "under-600": { min: 0, max: 600 },
  "600-800": { min: 600, max: 800 },
  "800-1000": { min: 800, max: 1000 },
  "1000-plus": { min: 1000, max: 99999 },
};

export interface OnboardingParams {
  intent: UserIntent | null;
  budget: string | null;
  movein: string | null;
  prefs: string[];
}

/** Filter pins by intent + budget + move-in (from /start flow) */
export function filterPinsByOnboarding(
  pins: Pin[],
  params: OnboardingParams
): Pin[] {
  let result = filterPinsByIntent(pins, params.intent);

  if (params.budget && BUDGET_RANGES[params.budget]) {
    const { min, max } = BUDGET_RANGES[params.budget];
    result = result.filter((p) => p.rent >= min && p.rent <= max);
  }

  if (params.movein && params.movein !== "asap") {
    result = result.filter((p) => p.moveInDate.startsWith(params.movein!));
  }

  if (params.prefs.length > 0) {
    result = result.filter((p) =>
      params.prefs.some((pref) => p.features.includes(pref))
    );
  }

  return result;
}
