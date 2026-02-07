"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Pin } from "@/lib/types";

export default function ListingsPage() {
  const [listings, setListings] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data: Pin[]) => setListings(Array.isArray(data) ? data : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" data-theme="app">
      <main className="pl-16 pt-6 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white mb-1">Listings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">All available listings. Contact by email.</p>

          {loading ? (
            <p className="text-zinc-500">Loading listings...</p>
          ) : (
            <ul className="space-y-3 mb-10">
              {listings.map((pin) => (
                <li
                  key={pin.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-zinc-950 dark:text-white">{pin.title}</h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{pin.address}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{pin.description}</p>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mt-2">
                        {pin.rent > 0 ? `$${pin.rent}/mo` : "—"} · {pin.moveInDate}
                      </p>
                      {pin.externalLink && (
                        <a
                          href={pin.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white underline"
                        >
                          View listing
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                          </svg>
                        </a>
                      )}
                    </div>
                    {pin.contactEmail && (
                      <a
                        href={`mailto:${pin.contactEmail}?subject=Re: ${encodeURIComponent(pin.title)}`}
                        className="shrink-0 rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-950 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Contact
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-2">Looking for a teammate?</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">List yourself so others can find you on the roommates map.</p>
            <Link
              href="/roommates/add"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-5 py-2.5 font-medium hover:opacity-90 transition-opacity"
            >
              Looking for teammate
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </Link>
          </div>

          <p className="mt-6 text-center">
            <Link href="/listings/map" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline">
              View listings on map →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
