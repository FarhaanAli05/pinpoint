import { RoommateProfile } from "./types";

export interface MatchResult {
  profile: RoommateProfile;
  score: number; // 0–100
  reasons: string[];
}

export function computeRoommateScore(
  me: RoommateProfile,
  other: RoommateProfile
): MatchResult {
  const reasons: string[] = [];
  let score = 0;
  let maxScore = 0;

  // --- Hard filters (30 pts each) ---

  // Move-in month overlap
  maxScore += 30;
  if (me.moveInMonth === other.moveInMonth) {
    score += 30;
    reasons.push(`Same move-in: ${me.moveInMonth}`);
  } else {
    reasons.push(
      `Move-in mismatch: you want ${me.moveInMonth}, they want ${other.moveInMonth}`
    );
  }

  // Budget overlap
  maxScore += 30;
  const overlapMin = Math.max(me.budgetMin, other.budgetMin);
  const overlapMax = Math.min(me.budgetMax, other.budgetMax);
  if (overlapMin <= overlapMax) {
    const overlapRange = overlapMax - overlapMin;
    const myRange = me.budgetMax - me.budgetMin;
    const theirRange = other.budgetMax - other.budgetMin;
    const avgRange = (myRange + theirRange) / 2 || 1;
    const overlapRatio = Math.min(overlapRange / avgRange, 1);
    const budgetScore = Math.round(30 * overlapRatio);
    score += budgetScore;
    reasons.push(`Budget overlap: $${overlapMin}–$${overlapMax}/mo`);
  } else {
    reasons.push(`No budget overlap`);
  }

  // --- Lifestyle sliders (10 pts each, 30 pts total) ---

  const lifestyleMatch = (a: string, b: string, label: string) => {
    maxScore += 10;
    if (a === b) {
      score += 10;
      reasons.push(`${label}: both ${a}`);
    } else {
      const levels = ["low", "early", "medium", "high", "late"];
      const diff = Math.abs(levels.indexOf(a) - levels.indexOf(b));
      if (diff <= 1) {
        score += 5;
        reasons.push(`${label}: compatible (${a} vs ${b})`);
      } else {
        reasons.push(`${label}: mismatch (${a} vs ${b})`);
      }
    }
  };

  lifestyleMatch(me.cleanliness, other.cleanliness, "Cleanliness");
  lifestyleMatch(me.sleepSchedule, other.sleepSchedule, "Sleep schedule");
  lifestyleMatch(me.guests, other.guests, "Guests");

  // --- Dealbreaker compatibility (10 pts) ---
  maxScore += 10;
  const dealbreakerConflicts: string[] = [];
  for (const d of me.dealbreakers) {
    if (d === "quiet" && other.guests === "high") {
      dealbreakerConflicts.push(
        "You want quiet but they host guests often"
      );
    }
  }
  if (dealbreakerConflicts.length === 0) {
    score += 10;
  } else {
    for (const c of dealbreakerConflicts) {
      reasons.push(c);
    }
  }

  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return { profile: other, score: pct, reasons };
}

export function getTopMatches(
  me: RoommateProfile,
  profiles: RoommateProfile[],
  limit?: number
): MatchResult[] {
  const matches = profiles
    .filter((p) => p.id !== me.id)
    .map((p) => computeRoommateScore(me, p))
    .sort((a, b) => b.score - a.score);
  return limit ? matches.slice(0, limit) : matches;
}
