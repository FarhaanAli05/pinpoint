"use client";

import { useApp } from "@/lib/context";
import { TrackerStatus } from "@/lib/types";
import Link from "next/link";

const COLUMNS: { status: TrackerStatus; label: string; color: string }[] = [
  { status: "saved", label: "Saved", color: "border-indigo-300 bg-indigo-50" },
  { status: "messaged", label: "Messaged", color: "border-blue-300 bg-blue-50" },
  { status: "viewing", label: "Viewing Scheduled", color: "border-amber-300 bg-amber-50" },
  { status: "rejected", label: "Rejected", color: "border-red-300 bg-red-50" },
];

export default function TrackerPage() {
  const { tracked, getPinById, trackPin } = useApp();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tracker</h1>
          <p className="text-sm text-muted">
            Track your housing applications in one place.
          </p>
        </div>
        <Link
          href="/map"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-primary-light hover:text-primary"
        >
          Back to Map
        </Link>
      </div>

      {tracked.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
          <p className="mb-2 text-lg font-medium text-muted">No tracked pins yet</p>
          <p className="mb-4 text-sm text-muted">
            Save or message listings from the map to see them here.
          </p>
          <Link
            href="/map"
            className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Go to Map
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = tracked.filter((t) => t.status === col.status);
            return (
              <div key={col.status}>
                <div
                  className={`mb-3 rounded-lg border-2 px-3 py-2 text-sm font-semibold ${col.color}`}
                >
                  {col.label}{" "}
                  <span className="font-normal text-muted">({items.length})</span>
                </div>
                <div className="space-y-2">
                  {items.map((item) => {
                    const pin = getPinById(item.pinId);
                    if (!pin) return null;
                    return (
                      <div
                        key={item.pinId}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <p className="mb-1 text-sm font-medium">{pin.title}</p>
                        <p className="text-xs text-muted">
                          ${pin.rent}/mo &middot; {pin.address}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {COLUMNS.filter((c) => c.status !== col.status).map(
                            (target) => (
                              <button
                                key={target.status}
                                onClick={() =>
                                  trackPin(item.pinId, target.status)
                                }
                                className="rounded-md border border-border px-2 py-0.5 text-xs text-muted transition-colors hover:bg-primary-light hover:text-primary"
                              >
                                Move to {target.label}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <p className="py-4 text-center text-xs text-muted">
                      No items
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
