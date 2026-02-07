"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "need" | "location" | "budget" | "movein" | "prefs" | "done";

const NEED_OPTIONS = [
  { value: "looking-for-room", label: "Looking for a sublease", desc: "I need a room or place to rent." },
  { value: "searching-with-mates", label: "Haven't found a place yet", desc: "I'm still searching and need roommates." },
  { value: "need-roommates", label: "I have a place, need roommates", desc: "I found a flat and need people to share it with." },
];

const LOCATION_OPTIONS = [
  { value: "near-campus", label: "Near campus" },
  { value: "downtown", label: "Downtown" },
  { value: "west-end", label: "West end" },
];

const BUDGET_OPTIONS = [
  { value: "under-600", label: "Under $600", min: 0, max: 600 },
  { value: "600-800", label: "$600 – $800", min: 600, max: 800 },
  { value: "800-1000", label: "$800 – $1000", min: 800, max: 1000 },
  { value: "1000-plus", label: "$1000+", min: 1000, max: 9999 },
];

const MOVEIN_OPTIONS = [
  { value: "2025-05", label: "May 2025" },
  { value: "2025-09", label: "Sept 2025" },
  { value: "2026-01", label: "Jan 2026" },
  { value: "asap", label: "ASAP" },
];

const PREF_OPTIONS = [
  { value: "quiet", label: "Quiet" },
  { value: "pet-free", label: "Pet-free" },
  { value: "smoking-free", label: "Smoking-free" },
];

export default function StartPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("need");
  const [need, setNeed] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [movein, setMovein] = useState<string>("");
  const [prefs, setPrefs] = useState<string[]>([]);

  const togglePref = (p: string) => {
    setPrefs((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleShowResults = () => {
    const params = new URLSearchParams();
    if (need) params.set("intent", need);
    if (location) params.set("area", location);
    if (budget) params.set("budget", budget);
    if (movein) params.set("movein", movein);
    if (prefs.length) params.set("prefs", prefs.join(","));
    params.set("from", "start");
    router.push(`/map?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <Link href="/" className="text-zinc-950 dark:text-white font-semibold text-lg">
          Pinpoint
        </Link>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10">
        {/* Chat-style: "AI" message then user choices */}
        {step === "need" && (
          <>
            <div className="mb-8">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Pinpoint</p>
              <p className="text-zinc-950 dark:text-white text-lg">
                What do you need? Are you looking for a sublease, haven't found a place yet, or already have a place and need roommates?
              </p>
            </div>
            <div className="space-y-2">
              {NEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setNeed(opt.value);
                    setStep("location");
                  }}
                  className="w-full text-left rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <p className="font-medium text-zinc-950 dark:text-white">{opt.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "location" && (
          <>
            <div className="mb-8">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Pinpoint</p>
              <p className="text-zinc-950 dark:text-white text-lg">Where are you looking?</p>
            </div>
            <div className="space-y-2">
              {LOCATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setLocation(opt.value);
                    setStep("budget");
                  }}
                  className="w-full text-left rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-950 dark:text-white font-medium"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep("need")}
              className="mt-4 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
            >
              ← Back
            </button>
          </>
        )}

        {step === "budget" && (
          <>
            <div className="mb-8">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Pinpoint</p>
              <p className="text-zinc-950 dark:text-white text-lg">What's your budget (per month)?</p>
            </div>
            <div className="space-y-2">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setBudget(opt.value);
                    setStep("movein");
                  }}
                  className="w-full text-left rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-950 dark:text-white font-medium"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setStep("location")} className="mt-4 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white">← Back</button>
          </>
        )}

        {step === "movein" && (
          <>
            <div className="mb-8">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Pinpoint</p>
              <p className="text-zinc-950 dark:text-white text-lg">When do you need to move in?</p>
            </div>
            <div className="space-y-2">
              {MOVEIN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setMovein(opt.value);
                    setStep("prefs");
                  }}
                  className="w-full text-left rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-950 dark:text-white font-medium"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setStep("budget")} className="mt-4 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white">← Back</button>
          </>
        )}

        {step === "prefs" && (
          <>
            <div className="mb-8">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">Pinpoint</p>
              <p className="text-zinc-950 dark:text-white text-lg">Any preferences? (optional)</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {PREF_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => togglePref(opt.value)}
                  className={`rounded-none border px-4 py-2 text-sm font-medium transition-colors ${
                    prefs.includes(opt.value)
                      ? "border-zinc-500 bg-zinc-600 dark:bg-zinc-700 text-white"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("movein")}
                className="text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
              >
                ← Back
              </button>
              <button
                onClick={handleShowResults}
                className="rounded-none border border-zinc-400 dark:border-zinc-600 bg-zinc-950 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                Show my results →
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
