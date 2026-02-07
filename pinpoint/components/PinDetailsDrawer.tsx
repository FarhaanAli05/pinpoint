"use client";

import { Pin, FitTag } from "@/lib/types";
import { useApp } from "@/lib/context";

const FIT_BADGE: Record<FitTag, { bg: string; text: string }> = {
  Great: { bg: "bg-green-100", text: "text-green-700" },
  OK: { bg: "bg-indigo-100", text: "text-indigo-700" },
  Conflict: { bg: "bg-red-100", text: "text-red-700" },
};

interface PinDetailsDrawerProps {
  pin: Pin;
  onClose: () => void;
  onDraftMessage: () => void;
}

export function PinDetailsDrawer({
  pin,
  onClose,
  onDraftMessage,
}: PinDetailsDrawerProps) {
  const { getFitTag, getFitReasons, trackPin, getTrackedStatus } = useApp();
  const tag = getFitTag(pin);
  const { good, bad } = getFitReasons(pin);
  const badge = FIT_BADGE[tag];
  const status = getTrackedStatus(pin.id);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="truncate text-lg font-bold">{pin.title}</h2>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
            >
              {tag}
            </span>
          </div>
          <p className="text-sm text-muted">{pin.address}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 rounded-md p-1 text-muted hover:bg-border hover:text-foreground"
          aria-label="Close"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l8 8M14 6l-8 8" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Key details */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-primary-light p-3">
            <p className="text-xs text-muted">Rent</p>
            <p className="text-lg font-bold text-primary">${pin.rent}/mo</p>
          </div>
          <div className="rounded-lg bg-primary-light p-3">
            <p className="text-xs text-muted">Move-in</p>
            <p className="text-lg font-bold text-primary">{pin.moveInDate}</p>
          </div>
          <div className="rounded-lg bg-primary-light p-3">
            <p className="text-xs text-muted">Type</p>
            <p className="text-sm font-semibold text-primary capitalize">
              {pin.type === "whole-unit" ? "Whole Unit" : "Room"}
            </p>
          </div>
          <div className="rounded-lg bg-primary-light p-3">
            <p className="text-xs text-muted">Bedrooms</p>
            <p className="text-sm font-semibold text-primary">{pin.bedrooms}</p>
          </div>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-foreground">
          {pin.description}
        </p>

        {/* Fit analysis */}
        {good.length > 0 && (
          <div className="mb-3">
            <h3 className="mb-1 text-xs font-semibold text-green-700">
              Fits your unit because...
            </h3>
            <ul className="space-y-1">
              {good.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-green-600">
                  <span className="mt-0.5 shrink-0">+</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {bad.length > 0 && (
          <div className="mb-3">
            <h3 className="mb-1 text-xs font-semibold text-red-700">
              Potential issues...
            </h3>
            <ul className="space-y-1">
              {bad.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                  <span className="mt-0.5 shrink-0">-</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Listing source / provenance */}
        <div className="mb-4 rounded-lg border border-border bg-gray-50 p-3">
          <h3 className="mb-1.5 text-xs font-semibold text-muted uppercase tracking-wide">
            Listing Source
          </h3>
          {pin.externalLink ? (
            <>
              <p className="text-xs text-foreground">
                Imported from:{" "}
                <span className="font-medium">
                  {pin.sourceLabel || "External link"}
                </span>
              </p>
              <a
                href={pin.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs text-primary underline"
              >
                View original listing
              </a>
            </>
          ) : (
            <p className="text-xs text-foreground">Manually added listing</p>
          )}
          <p className="mt-1 text-xs text-muted">
            Added by:{" "}
            {pin.sourceType === "seeded"
              ? "Demo data"
              : pin.addedByUnitId
                ? "Your group"
                : "A student"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <button
            onClick={onDraftMessage}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Draft Message
          </button>
          {status !== "saved" ? (
            <button
              onClick={() => trackPin(pin.id, "saved")}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-primary-light"
            >
              Save
            </button>
          ) : (
            <span className="flex items-center rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-xs font-medium text-green-700">
              Saved
            </span>
          )}
        </div>
        {status !== "messaged" && (
          <button
            onClick={() => trackPin(pin.id, "messaged")}
            className="mt-2 w-full rounded-lg border border-border py-2 text-xs font-medium text-muted transition-colors hover:bg-primary-light hover:text-primary"
          >
            Mark as Messaged
          </button>
        )}
        {status === "messaged" && (
          <p className="mt-2 text-center text-xs text-green-600 font-medium">
            Marked as messaged
          </p>
        )}
      </div>
    </div>
  );
}
