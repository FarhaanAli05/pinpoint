"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApp } from "@/lib/context";
import { Dealbreaker } from "@/lib/types";

const DEALBREAKER_OPTIONS: { value: Dealbreaker; label: string }[] = [
  { value: "pet-free", label: "Pet-free" },
  { value: "smoking-free", label: "Smoke-free" },
  { value: "quiet", label: "Quiet environment" },
];

export default function JoinUnitPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { unit, addMemberToUnit } = useApp();

  const [budgetMin, setBudgetMin] = useState(500);
  const [budgetMax, setBudgetMax] = useState(1000);
  const [dealbreakers, setDealbreakers] = useState<Dealbreaker[]>([]);

  function toggleDealbreaker(d: Dealbreaker) {
    setDealbreakers((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  // If unit doesn't exist or code doesn't match
  if (!unit || unit.code !== code) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="mb-2 text-2xl font-bold">Unit Not Found</h1>
        <p className="text-sm text-muted">
          This invite link is invalid or the unit hasn&apos;t been created yet on this
          device. Ask the unit creator to share their session.
        </p>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addMemberToUnit({ budgetMin, budgetMax, dealbreakers });
    router.push("/map");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold">Join Housing Unit</h1>
      <p className="mb-2 text-sm text-muted">
        You&apos;re joining unit <span className="font-mono font-semibold">{code}</span>
      </p>
      <p className="mb-8 text-xs text-muted">
        Current members: {unit.members.length} &middot; Move-in: {unit.moveInMonth}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Min budget ($/mo)
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={budgetMin}
              onChange={(e) => setBudgetMin(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Max budget ($/mo)
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={budgetMax}
              onChange={(e) => setBudgetMax(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Dealbreakers
          </label>
          <div className="flex flex-wrap gap-2">
            {DEALBREAKER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleDealbreaker(opt.value)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  dealbreakers.includes(opt.value)
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border text-muted hover:border-primary hover:text-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Join Unit &amp; View Map
        </button>
      </form>
    </div>
  );
}
