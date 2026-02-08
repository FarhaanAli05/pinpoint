"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type PersonProfile = {
  id: string;
  user_id: string;
  name: string;
  contact_email: string | null;
  budget_label: string | null;
  budget_min_cents: number | null;
  budget_max_cents: number | null;
  move_in: string | null;
  move_in_from: string | null;
  preferences: string[];
  location_label: string | null;
  location_lat: number | null;
  location_lng: number | null;
  note: string | null;
  listing_type: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export default function PersonProfilePage() {
  const [profile, setProfile] = useState<PersonProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    contact_email: "",
    budget_label: "",
    move_in_from: "",
    preferences: "",
    location_label: "",
    note: "",
    listing_type: "",
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/me/person-profile", { credentials: "include" }).then((res) => (res.ok ? res.json() : null)) as Promise<PersonProfile | null>,
      fetch("/api/me/profile", { credentials: "include" }).then((res) => (res.ok ? res.json() : null)) as Promise<{ profile?: { full_name?: string; email?: string }; preferences?: { move_in_from?: string; max_rent_cents?: number | null; notes?: string | null } } | null>,
    ])
      .then(([person, me]) => {
        if (cancelled) return;
        if (person) {
          setProfile(person);
          const moveIn = person.move_in_from != null ? String(person.move_in_from).slice(0, 10) : "";
          setForm({
            name: person.name ?? "",
            contact_email: person.contact_email ?? "",
            budget_label: person.budget_label ?? "",
            move_in_from: moveIn,
            preferences: Array.isArray(person.preferences) ? person.preferences.join(", ") : "",
            location_label: person.location_label ?? "",
            note: person.note ?? "",
            listing_type: person.listing_type ?? "",
          });
          return;
        }
        if (me?.profile || me?.preferences) {
          const p = me.profile ?? {};
          const prefs = me.preferences ?? {};
          const moveIn = prefs.move_in_from ?? "";
          const budget = prefs.max_rent_cents != null ? String(Math.round(prefs.max_rent_cents / 100)) : "";
          setForm({
            name: p.full_name ?? "",
            contact_email: p.email ?? "",
            budget_label: budget ? `$${budget}/mo` : "",
            move_in_from: moveIn,
            preferences: "",
            location_label: "",
            note: prefs.notes ?? "",
            listing_type: "",
          });
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const preferences = form.preferences
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/me/person-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim() || undefined,
          contact_email: form.contact_email.trim() || null,
          budget_label: form.budget_label.trim() || null,
          budget_max_cents: form.budget_label.trim() ? Math.round(parseFloat(form.budget_label.replace(/\D/g, "")) * 100) : null,
          move_in_from: form.move_in_from.trim() ? form.move_in_from.slice(0, 10) : null,
          preferences: preferences.length ? preferences : [],
          location_label: form.location_label.trim() || null,
          note: form.note.trim() || null,
          listing_type: form.listing_type.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setMessage({ type: "ok", text: "Preferences saved. You can change these anytime." });
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: err.error ?? "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" data-theme="app">
      <div className="pl-16 py-8">
        <div className="max-w-lg mx-auto px-6">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white text-sm">
              ← Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white mb-1">Your preferences</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Change your name, location, budget, and preferences anytime. Used for matching and your pins.
          </p>

          {loading ? (
            <p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Name</label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Alex"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact_email" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Contact email</label>
                <input
                  id="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="budget_label" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Budget (e.g. $700/mo)</label>
                <input
                  id="budget_label"
                  type="text"
                  value={form.budget_label}
                  onChange={(e) => setForm((f) => ({ ...f, budget_label: e.target.value }))}
                  placeholder="e.g. $600–800/mo"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="move_in_from" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Move-in date</label>
                <input
                  id="move_in_from"
                  type="date"
                  value={form.move_in_from}
                  onChange={(e) => setForm((f) => ({ ...f, move_in_from: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="location_label" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Location / area</label>
                <input
                  id="location_label"
                  type="text"
                  value={form.location_label}
                  onChange={(e) => setForm((f) => ({ ...f, location_label: e.target.value }))}
                  placeholder="e.g. Near Queen's, downtown"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="preferences" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Preferences (comma-separated)</label>
                <input
                  id="preferences"
                  type="text"
                  value={form.preferences}
                  onChange={(e) => setForm((f) => ({ ...f, preferences: e.target.value }))}
                  placeholder="e.g. quiet, no pets, non-smoker"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="listing_type" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Listing type</label>
                <input
                  id="listing_type"
                  type="text"
                  value={form.listing_type}
                  onChange={(e) => setForm((f) => ({ ...f, listing_type: e.target.value }))}
                  placeholder="e.g. looking for room + roommate"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="note" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Note</label>
                <textarea
                  id="note"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Short note about what you're looking for"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none resize-none"
                />
              </div>
              {message && (
                <p className={`text-sm ${message.type === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {message.text}
                </p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 rounded-lg border border-zinc-400 dark:border-zinc-600 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {saving ? "Saving..." : "Save preferences"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
