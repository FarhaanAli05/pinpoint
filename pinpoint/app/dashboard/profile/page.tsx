"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LeftSidebar } from "@/components/LeftSidebar";

type ProfileData = {
  profile: { full_name: string; email: string };
  preferences: { move_in_from: string; max_rent_cents: number | null; notes: string | null };
};

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    move_in_from: "",
    max_rent_cents: "",
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/profile", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((d: ProfileData | null) => {
        if (cancelled || !d) return;
        setData(d);
        setForm({
          full_name: d.profile.full_name ?? "",
          email: d.profile.email ?? "",
          move_in_from: d.preferences.move_in_from ?? "",
          max_rent_cents: d.preferences.max_rent_cents != null ? String(Math.round(d.preferences.max_rent_cents / 100)) : "",
          notes: d.preferences.notes ?? "",
        });
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
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          full_name: form.full_name.trim() || undefined,
          email: form.email.trim() || undefined,
          move_in_from: form.move_in_from || undefined,
          max_rent_cents: form.max_rent_cents.trim() ? Math.round(parseFloat(form.max_rent_cents.replace(/\D/g, "")) * 100) : null,
          notes: form.notes.trim() || null,
        }),
      });
      if (res.ok) {
        setMessage({ type: "ok", text: "Profile saved. These details will pre-fill when you add a pin." });
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
      <LeftSidebar />
      <div className="pl-16 py-8">
        <div className="max-w-lg mx-auto px-6">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/listings/map" className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white text-sm">
              ← Map
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white mb-1">View & edit profile</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            These details are saved and will pre-fill when you add yourself on the map, so you don&apos;t have to re-enter them each time.
          </p>

          {loading ? (
            <p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="full_name" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Name</label>
                <input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="e.g. Alex"
                  className="w-full rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Email (for people to contact you)</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="move_in_from" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Default move-in date</label>
                <input
                  id="move_in_from"
                  type="date"
                  value={form.move_in_from}
                  onChange={(e) => setForm((f) => ({ ...f, move_in_from: e.target.value }))}
                  className="w-full rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="max_rent_cents" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Default budget (max $/mo)</label>
                <input
                  id="max_rent_cents"
                  type="text"
                  inputMode="numeric"
                  value={form.max_rent_cents}
                  onChange={(e) => setForm((f) => ({ ...f, max_rent_cents: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
                  placeholder="e.g. 700"
                  className="w-full rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Default note (e.g. Student, quiet)</label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional short note for your pins"
                  rows={3}
                  className="w-full rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none resize-none"
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
                className="w-full py-3 px-4 rounded-none border border-zinc-400 dark:border-zinc-600 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save profile"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
