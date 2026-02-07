"use client";

import Link from "next/link";
import { useApp } from "@/lib/context";
import { LeftSidebar } from "@/components/LeftSidebar";
import type { Pin, ListingCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<ListingCategory, string> = {
  sublet: "Sublet",
  "share-listing": "Share listing",
  "looking-for-roommates": "Looking for roommates",
};
const CATEGORY_DESC: Record<ListingCategory, string> = {
  sublet: "Places to sublet — contact by email.",
  "share-listing": "Pasted listings — finding roommates to share the flat.",
  "looking-for-roommates": "People searching for an apartment + roommates (e.g. students).",
};

export default function DashboardPage() {
  const { pins } = useApp();

  const sublets = pins.filter((p) => p.category === "sublet");
  const shareListings = pins.filter((p) => p.category === "share-listing");
  const lookingForRoommates = pins.filter((p) => p.category === "looking-for-roommates");

  const avgRent =
    pins.length > 0
      ? Math.round(pins.reduce((s, p) => s + p.rent, 0) / pins.length)
      : 0;

  return (
    <div className="min-h-screen relative bg-zinc-100 dark:bg-zinc-950" data-theme="app">
      <LeftSidebar />
      <div className="pl-16 relative z-10">
        <div className="max-w-3xl mx-auto py-12 px-6">
          {/* Hero + main CTA */}
          <div className="text-center mb-14">
            <h1 className="font-mono text-4xl font-semibold text-zinc-950 dark:text-white mb-3 tracking-tight">
              Find your fit
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-base mb-6 max-w-md mx-auto">
              Describe what you want — we’ll show listings on the map and can match you with roommates.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
              <Link
                href="/find-room"
                className="inline-flex items-center gap-2 rounded-none border border-zinc-400 dark:border-zinc-600 bg-zinc-950 dark:bg-white px-6 py-3.5 text-base font-medium text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                Find a room
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              </Link>
              <Link
                href="/dashboard/find"
                className="inline-flex items-center gap-2 rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-3.5 text-base font-medium text-zinc-950 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Find roommates
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </Link>
            </div>
          </div>

          <p className="text-center text-zinc-500 text-sm mb-8">
            <Link href="/map" className="text-zinc-600 dark:text-zinc-400 underline hover:text-zinc-950 dark:hover:text-white">
              View full map
            </Link>
            {" · "}
            <Link href="/dashboard/profile" className="text-zinc-600 dark:text-zinc-400 underline hover:text-zinc-950 dark:hover:text-white">
              View & edit profile
            </Link>
            {" · "}
            <Link href="/start" className="text-zinc-600 dark:text-zinc-400 underline hover:text-zinc-950 dark:hover:text-white">
              Full onboarding
            </Link>
          </p>

          {/* Stats row — compact */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Total</p>
              <p className="text-xl font-semibold text-zinc-950 dark:text-white">{pins.length}</p>
            </div>
            <div className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Sublets</p>
              <p className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">{sublets.length}</p>
            </div>
            <div className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Share</p>
              <p className="text-xl font-semibold text-green-600 dark:text-green-400">{shareListings.length}</p>
            </div>
            <div className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Looking</p>
              <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">{lookingForRoommates.length}</p>
            </div>
          </div>

          <div className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 mb-10">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Average rent</p>
            <p className="text-lg font-semibold text-zinc-950 dark:text-white">
              {avgRent > 0 ? `$${avgRent}/mo` : "—"}
            </p>
          </div>

          <Section title="Sublets" description={CATEGORY_DESC.sublet} pins={sublets} />
          <Section title="Share a flat (paste URL)" description={CATEGORY_DESC["share-listing"]} pins={shareListings} />
          <Section title="Looking for roommates" description={CATEGORY_DESC["looking-for-roommates"]} pins={lookingForRoommates} />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  pins,
}: {
  title: string;
  description: string;
  pins: Pin[];
}) {
  if (pins.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="font-mono text-base font-semibold text-zinc-950 dark:text-white mb-1">{title}</h2>
      <p className="text-xs text-zinc-500 mb-2">{description}</p>
      <div className="space-y-1.5">
        {pins.slice(0, 4).map((pin) => (
          <Link
            key={pin.id}
            href="/map"
            className="block rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <p className="text-sm font-medium text-zinc-950 dark:text-white truncate">{pin.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {pin.areaLabel || pin.address} · ${pin.rent}/mo
            </p>
          </Link>
        ))}
      </div>
      {pins.length > 4 && (
        <p className="text-xs text-zinc-500 mt-1.5">+{pins.length - 4} more on map</p>
      )}
    </div>
  );
}
