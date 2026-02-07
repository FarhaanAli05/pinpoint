"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";

export function UnitSummary() {
  const { unit } = useApp();
  const [copied, setCopied] = useState(false);

  if (!unit) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted">
        No housing unit created yet.{" "}
        <a href="/onboarding" className="text-primary underline">
          Create one
        </a>
      </div>
    );
  }

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${unit.code}`
      : `/join/${unit.code}`;

  function handleCopyInvite() {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Your Housing Unit</h3>
        <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
          {unit.members.length} member{unit.members.length !== 1 && "s"}
        </span>
      </div>
      <div className="space-y-1 text-xs text-muted">
        <p>
          <span className="font-medium text-foreground">Budget:</span> ${unit.budgetMin}–$
          {unit.budgetMax}/mo
        </p>
        <p>
          <span className="font-medium text-foreground">Move-in:</span>{" "}
          {unit.moveInMonth}
        </p>
        {unit.dealbreakers.length > 0 && (
          <p>
            <span className="font-medium text-foreground">Dealbreakers:</span>{" "}
            {unit.dealbreakers.join(", ")}
          </p>
        )}
        <p>
          <span className="font-medium text-foreground">Roommates:</span>{" "}
          {unit.roommateOpenness}
        </p>
      </div>
      <button
        onClick={handleCopyInvite}
        className="mt-3 w-full rounded-md border border-border py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light"
      >
        {copied ? "Link copied!" : "Invite Roommates (copy link)"}
      </button>
    </div>
  );
}
