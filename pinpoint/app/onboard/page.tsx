"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import Link from "next/link";
import { savePreferences, type PreferredType } from "@/lib/actions/preferences";

const STORAGE_KEY = "pinpoint_onboarded";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const PREFERRED_OPTIONS: { value: PreferredType; label: string }[] = [
  { value: "rent", label: "Rent" },
  { value: "lease", label: "Lease" },
  { value: "sublet", label: "Sublet" },
];

export default function OnboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [where, setWhere] = useState("");
  const [fromWhen, setFromWhen] = useState(todayISO());
  const [toWhen, setToWhen] = useState("");
  const [preferredTypes, setPreferredTypes] = useState<PreferredType[]>([]);
  const [maxRent, setMaxRent] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (done === "1") {
        router.replace("/listings");
      }
    } catch {
      // ignore
    }
  }, [router]);

  const togglePreferred = (value: PreferredType) => {
    setPreferredTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!where.trim()) {
      setError("Please enter where you're looking.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const maxRentCents = maxRent.trim() ? Math.round(parseFloat(maxRent) * 100) : null;
      const res = await savePreferences({
        preferredTypes,
        locationEstimate: where.trim(),
        moveInFrom: fromWhen,
        moveInTo: toWhen.trim() || null,
        maxRentCents: maxRentCents && maxRentCents > 0 ? maxRentCents : null,
        notes: notes.trim() || null,
      });
      if (res.error) {
        setError(res.error);
        setSubmitting(false);
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, "1");
        localStorage.setItem("pinpoint_where", where.trim());
        localStorage.setItem("pinpoint_fromWhen", fromWhen);
      } catch {
        // ignore
      }
      router.replace("/listings");
    } catch {
      setError("Something went wrong.");
      setSubmitting(false);
    }
  };

  const email = typeof session?.user?.email === "string" ? session.user.email : "";

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-white mb-1">Set your preferences</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          We’ll use this to match you with listings and roommates.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email (from sign-in)
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-zinc-600 dark:text-zinc-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              What are you looking for? (pick one or more)
            </label>
            <div className="flex flex-wrap gap-2">
              {PREFERRED_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={preferredTypes.includes(value)}
                    onChange={() => togglePreferred(value)}
                    className="rounded border-zinc-400"
                  />
                  <span className="text-sm text-zinc-950 dark:text-white">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="where" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Location (estimated)
            </label>
            <input
              id="where"
              type="text"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="e.g. Kingston, ON or Near campus"
              required
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="fromWhen" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Move-in from
              </label>
              <input
                id="fromWhen"
                type="date"
                value={fromWhen}
                min={todayISO()}
                onChange={(e) => setFromWhen(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-950 dark:text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="toWhen" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Move-in to (optional)
              </label>
              <input
                id="toWhen"
                type="date"
                value={toWhen}
                min={fromWhen || todayISO()}
                onChange={(e) => setToWhen(e.target.value)}
                aria-describedby="toWhen-hint"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-950 dark:text-white focus:border-zinc-500 focus:outline-none"
              />
              <p id="toWhen-hint" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Leave blank if you’re flexible.</p>
            </div>
          </div>

          <div>
            <label htmlFor="maxRent" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Max rent per month (optional)
            </label>
            <input
              id="maxRent"
              type="number"
              min={0}
              step={50}
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              placeholder="e.g. 1200"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else we should know"
              rows={2}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 py-2.5 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Continue to listings"}
          </button>
        </form>
        <Link href="/" className="mt-4 block text-center text-sm text-zinc-500 hover:underline">
          ← Back
        </Link>
      </div>
    </div>
  );
}
