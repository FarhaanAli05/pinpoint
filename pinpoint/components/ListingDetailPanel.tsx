"use client";

import { Pin, ListingCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<ListingCategory, string> = {
  sublet: "Sublet",
  "share-listing": "Share listing",
  "looking-for-roommates": "Looking for roommates",
  "looking-for-room-and-roommate": "Looking for room + roommate",
  "have-room-need-roommates": "Have room, need people",
  "sublet-room": "Subletting a room",
};
const CATEGORY_BG: Record<ListingCategory, string> = {
  sublet: "bg-zinc-400 dark:bg-zinc-700",
  "share-listing": "bg-green-200 dark:bg-green-900/50 border border-green-600 dark:border-green-700",
  "looking-for-roommates": "bg-red-200 dark:bg-red-900/50 border border-red-600 dark:border-red-700",
  "looking-for-room-and-roommate": "bg-red-200 dark:bg-red-900/50 border border-red-600 dark:border-red-700",
  "have-room-need-roommates": "bg-blue-200 dark:bg-blue-900/50 border border-blue-600 dark:border-blue-700",
  "sublet-room": "bg-violet-200 dark:bg-violet-900/50 border border-violet-600 dark:border-violet-700",
};

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

interface ListingDetailPanelProps {
  pin: Pin;
  onClose: () => void;
}

export function ListingDetailPanel({ pin, onClose }: ListingDetailPanelProps) {
  const mailto = pin.contactEmail
    ? `mailto:${pin.contactEmail}?subject=Re: ${encodeURIComponent(pin.title)}`
    : null;

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-full max-w-md border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col shadow-2xl">
      <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="min-w-0 flex-1 pr-2">
          <span className={`inline-block mb-1.5 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 ${CATEGORY_BG[pin.category]}`}>
            {CATEGORY_LABELS[pin.category]}
          </span>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white truncate">{pin.title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{pin.areaLabel || pin.address}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-2 rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <XIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Rent</p>
            <p className="text-lg font-semibold text-zinc-950 dark:text-white">
              {pin.rent > 0 ? `$${pin.rent}/mo` : "—"}
            </p>
          </div>
          <div className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Move-in</p>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{pin.moveInDate}</p>
          </div>
          <div className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Type</p>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 capitalize">
              {pin.type === "whole-unit" ? "Whole unit" : "Room"}
            </p>
          </div>
          <div className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Bedrooms</p>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{pin.bedrooms}</p>
          </div>
          {pin.peopleCount != null && (
            <div className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3 col-span-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Roommates</p>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {pin.peopleCount === 1 ? "Looking for 1 roommate" : `Looking for ${pin.peopleCount} roommates`}
              </p>
            </div>
          )}
        </div>

        {pin.areaLabel && pin.category === "looking-for-roommates" && (
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Area · {pin.areaLabel}</p>
        )}

        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{pin.description}</p>

        {pin.features.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Features</p>
            <div className="flex flex-wrap gap-1.5">
              {pin.features.map((f) => (
                <span
                  key={f}
                  className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300"
                >
                  {f.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {pin.externalLink && (
          <a
            href={pin.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
            View listing
          </a>
        )}
      </div>

      {mailto && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
          <a
            href={mailto}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-none border border-zinc-300 dark:border-zinc-700 bg-zinc-900 dark:bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
          >
            <MailIcon />
            Email to connect
          </a>
          <p className="text-xs text-zinc-500 mt-2 text-center truncate">
            {pin.contactEmail}
          </p>
        </div>
      )}
    </aside>
  );
}
