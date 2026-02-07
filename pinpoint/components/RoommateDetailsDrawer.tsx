"use client";

import { useState } from "react";
import { RoommateProfile } from "@/lib/types";
import { MatchResult } from "@/lib/roommate-match";
import { useApp } from "@/lib/context";

interface RoommateDetailsDrawerProps {
  match: MatchResult;
  myProfile: RoommateProfile;
  onClose: () => void;
}

export function RoommateDetailsDrawer({
  match,
  myProfile,
  onClose,
}: RoommateDetailsDrawerProps) {
  const { unit } = useApp();
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const scoreColor =
    match.score >= 75
      ? "text-green-700 bg-green-100"
      : match.score >= 50
      ? "text-indigo-700 bg-indigo-100"
      : "text-red-700 bg-red-100";

  const topReasons = match.reasons.slice(0, 2);

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

  function handleCopyMessage() {
    if (message) {
      navigator.clipboard.writeText(message);
      setCopied("message");
      setTimeout(() => setCopied(null), 2000);
    }
  }

  function handleInvite() {
    const inviteText = unit
      ? `Hey ${match.profile.name}! I'm ${myProfile.name} from Pinpoint. We're looking for roommates for our housing unit (${unit.members.length} member${unit.members.length !== 1 ? "s" : ""}, move-in ${unit.moveInMonth}). Join us: ${window.location.origin}/join/${unit.code}`
      : `Hey ${match.profile.name}! I'm ${myProfile.name} from Pinpoint. Want to team up and look for housing together?`;
    navigator.clipboard.writeText(inviteText);
    setCopied("invite");
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="truncate text-lg font-bold">
              {match.profile.name}
            </h2>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${scoreColor}`}
            >
              {match.score}% match
            </span>
          </div>
          {match.profile.program && (
            <p className="text-sm text-muted">{match.profile.program}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 rounded-md p-1 text-muted hover:bg-border hover:text-foreground"
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 6l8 8M14 6l-8 8" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Key details grid */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-primary-light p-2.5 text-center">
            <p className="text-xs text-muted">Budget</p>
            <p className="text-sm font-bold text-primary">
              ${match.profile.budgetMin}–${match.profile.budgetMax}
            </p>
          </div>
          <div className="rounded-lg bg-primary-light p-2.5 text-center">
            <p className="text-xs text-muted">Move-in</p>
            <p className="text-sm font-bold text-primary">
              {match.profile.moveInMonth}
            </p>
          </div>
          <div className="rounded-lg bg-primary-light p-2.5 text-center">
            <p className="text-xs text-muted">Sleep</p>
            <p className="text-sm font-bold text-primary capitalize">
              {match.profile.sleepSchedule}
            </p>
          </div>
        </div>

        {/* Lifestyle pills */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-muted">
            Cleanliness: {match.profile.cleanliness}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-muted">
            Guests: {match.profile.guests}
          </span>
          {match.profile.dealbreakers.map((d) => (
            <span
              key={d}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-muted capitalize"
            >
              {d}
            </span>
          ))}
        </div>

        {/* About me */}
        {match.profile.aboutMe && (
          <p className="mb-4 text-sm leading-relaxed text-foreground italic">
            &quot;{match.profile.aboutMe}&quot;
          </p>
        )}

        {/* Match reasons */}
        <div className="mb-4 space-y-1">
          <h3 className="mb-1 text-xs font-semibold text-muted uppercase tracking-wide">
            Why you match
          </h3>
          {topReasons.map((reason, i) => (
            <p key={i} className="text-xs text-muted">
              <span className="mr-1 inline-block">
                {reason.includes("mismatch") || reason.includes("No ")
                  ? "—"
                  : "+"}
              </span>
              {reason}
            </p>
          ))}
        </div>

        {/* AI-generated message */}
        {message && (
          <div className="mb-4 rounded-lg bg-primary-light p-2.5">
            <p className="text-xs text-foreground whitespace-pre-wrap">
              {message}
            </p>
            <button
              onClick={handleCopyMessage}
              className="mt-1.5 text-xs font-medium text-primary hover:underline"
            >
              {copied === "message" ? "Copied!" : "Copy message"}
            </button>
          </div>
        )}

        {/* Messaging note */}
        <div className="rounded-lg border border-border bg-gray-50 p-3">
          <p className="text-xs text-muted">
            Messaging happens externally (text/FB/IG). Pinpoint helps you craft
            the message.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <button
            onClick={handleGenerateMessage}
            disabled={generatingMessage}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {generatingMessage
              ? "Generating..."
              : message
              ? "Regenerate Message"
              : "Generate Intro Message"}
          </button>
          <button
            onClick={handleInvite}
            className="rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-primary-light"
          >
            {copied === "invite" ? "Copied!" : "Invite to Unit"}
          </button>
        </div>
      </div>
    </div>
  );
}
