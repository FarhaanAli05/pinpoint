"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "area" | "budget" | "movein" | "type" | "prefs" | "done";

const AREA_OPTIONS = [
  { value: "near-campus", label: "Near campus" },
  { value: "downtown", label: "Downtown" },
  { value: "west-end", label: "West end" },
];

const BUDGET_OPTIONS = [
  { value: "under-600", label: "Under $600" },
  { value: "600-800", label: "$600 – $800" },
  { value: "800-1000", label: "$800 – $1000" },
  { value: "1000-plus", label: "$1000+" },
];

const MOVEIN_OPTIONS = [
  { value: "2025-05", label: "May 2025" },
  { value: "2025-09", label: "Sept 2025" },
  { value: "2026-01", label: "Jan 2026" },
  { value: "asap", label: "ASAP" },
];

const TYPE_OPTIONS = [
  { value: "room", label: "Room (shared place)" },
  { value: "whole-unit", label: "Whole unit" },
];

const PREF_OPTIONS = [
  { value: "quiet", label: "Quiet" },
  { value: "pet-free", label: "Pet-free" },
  { value: "smoking-free", label: "Smoking-free" },
];

export default function FindRoomPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("area");
  const [area, setArea] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [movein, setMovein] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [prefs, setPrefs] = useState<string[]>([]);
  const [alsoFindRoommates, setAlsoFindRoommates] = useState(false);

  const togglePref = (p: string) => {
    setPrefs((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleShowListings = () => {
    const params = new URLSearchParams();
    if (area) params.set("area", area);
    if (budget) params.set("budget", budget);
    if (movein) params.set("movein", movein);
    if (type) params.set("type", type);
    if (prefs.length) params.set("prefs", prefs.join(","));
    params.set("from", "find-room");
    if (alsoFindRoommates) {
      params.set("view", "roommates");
      params.set("wantRoommates", "1");
    } else {
      params.set("view", "listings");
    }
    router.push(`/map?${params.toString()}`);
  };

  const baseCls = "w-full text-left rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-950 dark:text-white font-medium";
  const backCls = "text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white";

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" data-theme="app">
      <main className="pl-16 max-w-xl mx-auto w-full px-6 py-10">
        <h1 className="font-mono text-2xl font-semibold text-zinc-950 dark:text-white mb-1">
          Find a room
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8">
          Describe what you want — we&apos;ll show matching listings on the map. Optionally connect to roommate matches.
        </p>

        {step === "area" && (
          <>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">Where are you looking?</p>
            <div className="space-y-2">
              {AREA_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => { setArea(opt.value); setStep("budget"); }} className={baseCls}>
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === "budget" && (
          <>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">Budget per month?</p>
            <div className="space-y-2">
              {BUDGET_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => { setBudget(opt.value); setStep("movein"); }} className={baseCls}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setStep("area")} className={`mt-4 ${backCls}`}>← Back</button>
          </>
        )}

        {step === "movein" && (
          <>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">When do you need to move in?</p>
            <div className="space-y-2">
              {MOVEIN_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => { setMovein(opt.value); setStep("type"); }} className={baseCls}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setStep("budget")} className={`mt-4 ${backCls}`}>← Back</button>
          </>
        )}

        {step === "type" && (
          <>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">Room or whole unit?</p>
            <div className="space-y-2">
              {TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => { setType(opt.value); setStep("prefs"); }} className={baseCls}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setStep("movein")} className={`mt-4 ${backCls}`}>← Back</button>
          </>
        )}

        {step === "prefs" && (
          <>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">Any preferences? (optional)</p>
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
            <div className="space-y-4">
              <button
                onClick={handleShowListings}
                className="rounded-none border border-zinc-400 dark:border-zinc-600 bg-zinc-950 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors w-full"
              >
                Show my listings →
              </button>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={alsoFindRoommates}
                  onChange={(e) => setAlsoFindRoommates(e.target.checked)}
                  className="rounded border-zinc-400 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
                Also find roommates (AI will match you with people looking for mates)
              </label>
            </div>
            <button onClick={() => setStep("type")} className={`mt-4 ${backCls}`}>← Back</button>
          </>
        )}
      </main>
    </div>
  );
}
