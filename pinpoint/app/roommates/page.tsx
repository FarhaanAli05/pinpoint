"use client";

import { useState, useMemo, useCallback } from "react";
import { useApp } from "@/lib/context";
import {
  RoommateProfile,
  Dealbreaker,
  LifestyleLevel,
  SleepSchedule,
} from "@/lib/types";

// --- Deterministic Scoring ---

interface MatchResult {
  profile: RoommateProfile;
  score: number; // 0–100
  reasons: string[];
}

function computeRoommateScore(
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
    reasons.push(`Move-in mismatch: you want ${me.moveInMonth}, they want ${other.moveInMonth}`);
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

  const lifestyleMatch = (
    a: string,
    b: string,
    label: string
  ) => {
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
    if (d === "pet-free" && !other.dealbreakers.includes("pet-free")) {
      // Not a conflict per se — just not shared
    }
    if (d === "quiet" && other.guests === "high") {
      dealbreakerConflicts.push("You want quiet but they host guests often");
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

// --- Profile Form ---

function ProfileForm({
  onSubmit,
}: {
  onSubmit: (profile: RoommateProfile) => void;
}) {
  const [name, setName] = useState("");
  const [program, setProgram] = useState("");
  const [budgetMin, setBudgetMin] = useState("600");
  const [budgetMax, setBudgetMax] = useState("900");
  const [moveInMonth, setMoveInMonth] = useState("2025-09");
  const [dealbreakers, setDealbreakers] = useState<Dealbreaker[]>([]);
  const [cleanliness, setCleanliness] = useState<LifestyleLevel>("medium");
  const [sleepSchedule, setSleepSchedule] = useState<SleepSchedule>("medium");
  const [guests, setGuests] = useState<LifestyleLevel>("medium");
  const [aboutMe, setAboutMe] = useState("");

  function toggleDealbreaker(d: Dealbreaker) {
    setDealbreakers((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const profile: RoommateProfile = {
      id: `profile-${crypto.randomUUID()}`,
      name: name.trim() || "Anonymous",
      program: program.trim() || undefined,
      budgetMin: Number(budgetMin) || 500,
      budgetMax: Number(budgetMax) || 1000,
      moveInMonth,
      dealbreakers,
      cleanliness,
      sleepSchedule,
      guests,
      aboutMe: aboutMe.trim() || undefined,
      createdAt: Date.now(),
    };
    onSubmit(profile);
  }

  const DEALBREAKER_OPTIONS: { value: Dealbreaker; label: string }[] = [
    { value: "pet-free", label: "Pet-free" },
    { value: "smoking-free", label: "Smoke-free" },
    { value: "quiet", label: "Quiet" },
  ];

  const LEVEL_OPTIONS: { value: LifestyleLevel; label: string }[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const SLEEP_OPTIONS: { value: SleepSchedule; label: string }[] = [
    { value: "early", label: "Early bird" },
    { value: "medium", label: "Average" },
    { value: "late", label: "Night owl" },
  ];

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
          First Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your first name"
          required
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
          Program / Year (optional)
        </label>
        <input
          type="text"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          placeholder="e.g. Engineering, 2nd year"
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
            Budget Min ($/mo)
          </label>
          <input
            type="number"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            min="0"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
            Budget Max ($/mo)
          </label>
          <input
            type="number"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            min="0"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
          Move-in Month
        </label>
        <input
          type="month"
          value={moveInMonth}
          onChange={(e) => setMoveInMonth(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
          Dealbreakers
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DEALBREAKER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleDealbreaker(opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                dealbreakers.includes(opt.value)
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-muted hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
          Cleanliness
        </label>
        <div className="flex gap-1.5">
          {LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCleanliness(opt.value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                cleanliness === opt.value
                  ? "border-primary bg-primary-light text-primary"
                  : "border-border text-muted hover:border-primary/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
          Sleep Schedule
        </label>
        <div className="flex gap-1.5">
          {SLEEP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSleepSchedule(opt.value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                sleepSchedule === opt.value
                  ? "border-primary bg-primary-light text-primary"
                  : "border-border text-muted hover:border-primary/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
          Guests
        </label>
        <div className="flex gap-1.5">
          {LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGuests(opt.value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                guests === opt.value
                  ? "border-primary bg-primary-light text-primary"
                  : "border-border text-muted hover:border-primary/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-muted uppercase tracking-wide">
          About Me (optional)
        </label>
        <textarea
          value={aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          placeholder="A few words about your living preferences..."
          rows={2}
          maxLength={200}
          className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        Create Profile & Find Matches
      </button>
    </form>
  );
}

// --- Match Card ---

function MatchCard({
  match,
  myProfile,
}: {
  match: MatchResult;
  myProfile: RoommateProfile;
}) {
  const { unit } = useApp();
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const scoreColor =
    match.score >= 75
      ? "text-green-700 bg-green-100"
      : match.score >= 50
      ? "text-indigo-700 bg-indigo-100"
      : "text-red-700 bg-red-100";

  // Pick top 3 reasons
  const topReasons = match.reasons.slice(0, 3);

  async function handleGenerateMessage() {
    setGeneratingMessage(true);
    try {
      const res = await fetch("/api/roommate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          myProfile,
          theirProfile: match.profile,
        }),
      });
      const data = await res.json();
      setMessage(data.message);
    } catch {
      setMessage(
        `Hey ${match.profile.name}! I'm ${myProfile.name}, looking for a roommate around ${myProfile.moveInMonth}. Want to chat?`
      );
    }
    setGeneratingMessage(false);
  }

  function handleInvite() {
    const inviteText = unit
      ? `Hey ${match.profile.name}! I'm ${myProfile.name} from Pinpoint. We're looking for roommates for our housing unit (${unit.members.length} member${unit.members.length !== 1 ? "s" : ""}, move-in ${unit.moveInMonth}). Join us: ${window.location.origin}/join/${unit.code}`
      : `Hey ${match.profile.name}! I'm ${myProfile.name} from Pinpoint. Want to team up and look for housing together?`;
    navigator.clipboard.writeText(inviteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyMessage() {
    if (message) {
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold">{match.profile.name}</h3>
          {match.profile.program && (
            <p className="text-xs text-muted">{match.profile.program}</p>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${scoreColor}`}
        >
          {match.score}% match
        </span>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-gray-50 p-1.5 text-center">
          <span className="block font-semibold">${match.profile.budgetMin}–${match.profile.budgetMax}</span>
          <span className="text-muted">Budget</span>
        </div>
        <div className="rounded-lg bg-gray-50 p-1.5 text-center">
          <span className="block font-semibold">{match.profile.moveInMonth}</span>
          <span className="text-muted">Move-in</span>
        </div>
        <div className="rounded-lg bg-gray-50 p-1.5 text-center">
          <span className="block font-semibold capitalize">{match.profile.sleepSchedule}</span>
          <span className="text-muted">Sleep</span>
        </div>
      </div>

      {match.profile.aboutMe && (
        <p className="mt-2 text-xs text-muted italic">
          &quot;{match.profile.aboutMe}&quot;
        </p>
      )}

      <div className="mt-2 space-y-1">
        {topReasons.map((reason, i) => (
          <p key={i} className="text-xs text-muted">
            <span className="mr-1 inline-block">
              {reason.includes("mismatch") || reason.includes("No ") ? "—" : "+"}
            </span>
            {reason}
          </p>
        ))}
      </div>

      {message && (
        <div className="mt-3 rounded-lg bg-primary-light p-2.5">
          <p className="text-xs text-foreground whitespace-pre-wrap">{message}</p>
          <button
            onClick={handleCopyMessage}
            className="mt-1.5 text-xs font-medium text-primary hover:underline"
          >
            {copied ? "Copied!" : "Copy message"}
          </button>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleGenerateMessage}
          disabled={generatingMessage}
          className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {generatingMessage
            ? "Generating..."
            : message
            ? "Regenerate Message"
            : "Generate Intro Message"}
        </button>
        <button
          onClick={handleInvite}
          className="rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-primary-light"
        >
          {copied ? "Copied!" : "Invite to Unit"}
        </button>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function RoommatesPage() {
  const { roommateProfiles, myProfileId, addRoommateProfile, setMyProfileId } =
    useApp();

  const myProfile = useMemo(
    () => roommateProfiles.find((p) => p.id === myProfileId) ?? null,
    [roommateProfiles, myProfileId]
  );

  const matches = useMemo(() => {
    if (!myProfile) return [];
    return roommateProfiles
      .filter((p) => p.id !== myProfile.id)
      .map((p) => computeRoommateScore(myProfile, p))
      .sort((a, b) => b.score - a.score);
  }, [myProfile, roommateProfiles]);

  const handleProfileCreate = useCallback(
    (profile: RoommateProfile) => {
      addRoommateProfile(profile);
      setMyProfileId(profile.id);
    },
    [addRoommateProfile, setMyProfileId]
  );

  return (
    <div className="min-h-[calc(100vh-49px)] bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">Roommate Matchmaking</h1>
        <p className="mt-1 text-sm text-muted">
          Find compatible roommates based on budget, move-in timing, and
          lifestyle preferences.
        </p>

        {!myProfile ? (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-semibold">
              Create Your Roommate Profile
            </h2>
            <ProfileForm onSubmit={handleProfileCreate} />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* My profile summary */}
            <div className="rounded-xl border border-primary/20 bg-primary-light p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Your Profile
                  </p>
                  <h3 className="text-sm font-bold">{myProfile.name}</h3>
                  {myProfile.program && (
                    <p className="text-xs text-muted">{myProfile.program}</p>
                  )}
                </div>
                <div className="text-right text-xs text-muted">
                  <p>${myProfile.budgetMin}–${myProfile.budgetMax}/mo</p>
                  <p>Move-in: {myProfile.moveInMonth}</p>
                </div>
              </div>
            </div>

            {/* Matches */}
            <div>
              <h2 className="mb-3 text-lg font-semibold">
                Your Matches ({matches.length})
              </h2>
              {matches.length === 0 ? (
                <p className="text-sm text-muted">
                  No other profiles found yet. Share Pinpoint with friends!
                </p>
              ) : (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <MatchCard
                      key={match.profile.id}
                      match={match}
                      myProfile={myProfile}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
