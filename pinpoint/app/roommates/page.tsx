"use client";

import { useState, useMemo, useCallback } from "react";
import { useApp } from "@/lib/context";
import {
  RoommateProfile,
  Dealbreaker,
  LifestyleLevel,
  SleepSchedule,
} from "@/lib/types";
import { MatchResult, getTopMatches } from "@/lib/roommate-match";

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

  const inputClass = "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div>
        <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-subtle">
          First Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your first name"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-subtle">
          Program / Year (optional)
        </label>
        <input
          type="text"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          placeholder="e.g. Engineering, 2nd year"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-subtle">
            Budget Min ($/mo)
          </label>
          <input
            type="number"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            min="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-subtle">
            Budget Max ($/mo)
          </label>
          <input
            type="number"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            min="0"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-subtle">
          Move-in Month
        </label>
        <input
          type="month"
          value={moveInMonth}
          onChange={(e) => setMoveInMonth(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-subtle">
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
                  ? "bg-primary text-background"
                  : "bg-surface-elevated text-muted hover:bg-card-hover"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-subtle">
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
                  : "border-border bg-card text-muted hover:border-border-subtle"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-subtle">
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
                  : "border-border bg-card text-muted hover:border-border-subtle"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-subtle">
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
                  : "border-border bg-card text-muted hover:border-border-subtle"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wider text-muted-subtle">
          About Me (optional)
        </label>
        <textarea
          value={aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          placeholder="A few words about your living preferences..."
          rows={2}
          maxLength={200}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-background transition-colors hover:bg-primary-hover disabled:opacity-50"
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
      ? "text-fit-great bg-fit-great-bg"
      : match.score >= 50
      ? "text-fit-ok bg-fit-ok-bg"
      : "text-fit-conflict bg-fit-conflict-bg";

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
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">{match.profile.name}</h3>
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
        <div className="rounded-lg border border-border bg-surface p-1.5 text-center">
          <span className="block font-semibold text-foreground">${match.profile.budgetMin}–${match.profile.budgetMax}</span>
          <span className="text-muted-subtle">Budget</span>
        </div>
        <div className="rounded-lg border border-border bg-surface p-1.5 text-center">
          <span className="block font-semibold text-foreground">{match.profile.moveInMonth}</span>
          <span className="text-muted-subtle">Move-in</span>
        </div>
        <div className="rounded-lg border border-border bg-surface p-1.5 text-center">
          <span className="block font-semibold text-foreground capitalize">{match.profile.sleepSchedule}</span>
          <span className="text-muted-subtle">Sleep</span>
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
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary-light p-2.5">
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
          className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-background transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {generatingMessage
            ? "Generating..."
            : message
            ? "Regenerate Message"
            : "Generate Intro Message"}
        </button>
        <button
          onClick={handleInvite}
          className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-elevated"
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
    return getTopMatches(myProfile, roommateProfiles);
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
        <h1 className="text-2xl font-bold text-foreground">Roommate Matchmaking</h1>
        <p className="mt-1 text-sm text-muted">
          Find compatible roommates based on budget, move-in timing, and
          lifestyle preferences.
        </p>

        {!myProfile ? (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
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
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                    Your Profile
                  </p>
                  <h3 className="text-sm font-bold text-foreground">{myProfile.name}</h3>
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
              <h2 className="mb-3 text-lg font-semibold text-foreground">
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
