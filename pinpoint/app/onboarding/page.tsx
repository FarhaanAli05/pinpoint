"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Dealbreaker, RoommateOpenness } from "@/lib/types";

const DEALBREAKER_OPTIONS: { value: Dealbreaker; label: string }[] = [
  { value: "pet-free", label: "Pet-free" },
  { value: "smoking-free", label: "Smoke-free" },
  { value: "quiet", label: "Quiet environment" },
];

const ROOMMATE_OPTIONS: { value: RoommateOpenness; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setUnit } = useApp();

  const [moveInMonth, setMoveInMonth] = useState("2025-09");
  const [budgetMin, setBudgetMin] = useState(500);
  const [budgetMax, setBudgetMax] = useState(1000);
  const [dealbreakers, setDealbreakers] = useState<Dealbreaker[]>([]);
  const [roommateOpenness, setRoommateOpenness] =
    useState<RoommateOpenness>("maybe");

  function toggleDealbreaker(d: Dealbreaker) {
    setDealbreakers((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = Math.random().toString(36).slice(2, 8);
    setUnit({
      id: crypto.randomUUID(),
      code,
      moveInMonth,
      budgetMin,
      budgetMax,
      dealbreakers,
      roommateOpenness,
      members: [
        {
          id: crypto.randomUUID(),
          budgetMin,
          budgetMax,
          dealbreakers,
        },
      ],
    });
    router.push("/map");
  }

  const inputClass = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Create Your Housing Unit</h1>
      <p className="mb-8 text-sm text-muted">
        Tell us your preferences. You can invite roommates later.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Move-in month */}
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Move-in month
          </label>
          <input
            type="month"
            value={moveInMonth}
            onChange={(e) => setMoveInMonth(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        {/* Budget range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Min budget ($/mo)
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={budgetMin}
              onChange={(e) => setBudgetMin(Number(e.target.value))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Max budget ($/mo)
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={budgetMax}
              onChange={(e) => setBudgetMax(Number(e.target.value))}
              className={inputClass}
              required
            />
          </div>
        </div>

        {/* Dealbreakers */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
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
                    : "border-border text-muted hover:border-primary/40 hover:text-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Distance anchor */}
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Distance anchor
          </label>
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted">
            Queen&apos;s University Campus (fixed for demo)
          </div>
        </div>

        {/* Roommate openness */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Open to roommates?
          </label>
          <div className="flex gap-2">
            {ROOMMATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRoommateOpenness(opt.value)}
                className={`rounded-full border px-5 py-1.5 text-sm font-medium transition-colors ${
                  roommateOpenness === opt.value
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border text-muted hover:border-primary/40 hover:text-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-background transition-colors hover:bg-primary-hover"
        >
          Create Unit &amp; View Map
        </button>
      </form>
    </div>
  );
}
