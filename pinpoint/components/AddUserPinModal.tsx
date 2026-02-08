"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Pin } from "@/lib/types";

type UserPinType = "need-room" | "need-roommates";

export type AddUserPinInitialValues = {
  name?: string;
  email?: string;
  budget?: string;
  move_in_from?: string;
  notes?: string;
};

interface AddUserPinModalProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onSubmit: (pin: Pin) => void;
  /** Pre-fill from saved profile (fetch from /api/me/profile when opening modal) */
  initialValues?: AddUserPinInitialValues;
  /** e.g. "Sign in to add a pin" when POST returned 401 */
  error?: string | null;
}

export function AddUserPinModal({ lat, lng, onClose, onSubmit, initialValues, error: externalError }: AddUserPinModalProps) {
  const [type, setType] = useState<UserPinType>("need-room");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [budget, setBudget] = useState(initialValues?.budget ?? "");
  const [moveIn, setMoveIn] = useState(initialValues?.move_in_from ?? "");
  const [peopleCount, setPeopleCount] = useState("");
  const [note, setNote] = useState(initialValues?.notes ?? "");

  useEffect(() => {
    if (!initialValues) return;
    if (initialValues.name !== undefined) setName(initialValues.name);
    if (initialValues.email !== undefined) setEmail(initialValues.email);
    if (initialValues.budget !== undefined) setBudget(initialValues.budget);
    if (initialValues.move_in_from !== undefined) setMoveIn(initialValues.move_in_from);
    if (initialValues.notes !== undefined) setNote(initialValues.notes);
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const title =
      name.trim() && type === "need-room"
        ? `${name.trim()}: Looking for a room here`
        : name.trim() && type === "need-roommates"
          ? `${name.trim()}: Looking for roommates in this area`
          : type === "need-room"
            ? "Looking for a room here"
            : "Looking for roommates in this area";

    const parts: string[] = [];
    if (note.trim()) parts.push(note.trim());
    if (budget.trim()) parts.push(`Budget: $${budget.trim()}/mo`);
    if (moveIn.trim()) parts.push(`Move-in: ${moveIn.trim()}`);
    if (type === "need-roommates" && peopleCount.trim()) parts.push(`Looking for ${peopleCount.trim()} roommate(s).`);
    const description = parts.length ? parts.join(". ") : type === "need-room" ? "Looking for a room in this area. Contact by email." : "Looking for roommates in this area. Contact by email.";

    const budgetNum = budget.trim() ? parseInt(budget.replace(/\D/g, ""), 10) : undefined;
    const rent = typeof budgetNum === "number" && budgetNum > 0 ? budgetNum : 0;
    const moveInDate = moveIn.trim() ? moveIn.trim().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const numPeople = peopleCount.trim() ? parseInt(peopleCount.replace(/\D/g, ""), 10) : undefined;

    const pin: Pin = {
      id: `user-${Date.now()}`,
      lat,
      lng,
      rent,
      moveInDate,
      type: "room",
      category: type === "need-roommates" ? "looking-for-roommates" : "looking-for-room-and-roommate",
      title,
      description,
      address: "Selected on map",
      bedrooms: 1,
      features: [],
      contactEmail: email.trim(),
      areaLabel: "Added by user (double-click on map)",
      sourceType: "user-added",
      createdAt: Date.now(),
      peopleCount: typeof numPeople === "number" && numPeople >= 1 && numPeople <= 20 ? numPeople : undefined,
    };
    onSubmit(pin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-mono text-lg font-semibold text-zinc-950 dark:text-white mb-1">
          Add yourself on the map
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Double-clicked location. Your details will be saved and others can contact you.
        </p>
        {externalError && (
          <div className="mb-4 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 text-sm">
            {externalError}
            <Link href="/auth/signin?callbackUrl=/roommates" className="ml-1 underline font-medium hover:no-underline">
              Sign in
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">What do you need?</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="need-room"
                  checked={type === "need-room"}
                  onChange={() => setType("need-room")}
                  className="rounded-none border-zinc-400 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
                <span className="text-sm text-zinc-950 dark:text-white">I need a room in this area</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="need-roommates"
                  checked={type === "need-roommates"}
                  onChange={() => setType("need-roommates")}
                  className="rounded-none border-zinc-400 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
                <span className="text-sm text-zinc-950 dark:text-white">I need roommates in this area</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-none border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-none border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="budget" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Budget (max $/mo)
            </label>
            <input
              id="budget"
              type="text"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="e.g. 700 or 800"
              className="w-full rounded-none border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="moveIn" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Move-in date
            </label>
            <input
              id="moveIn"
              type="date"
              value={moveIn}
              onChange={(e) => setMoveIn(e.target.value)}
              className="w-full rounded-none border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>

          {type === "need-roommates" && (
            <div>
              <label htmlFor="peopleCount" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                How many roommates?
              </label>
              <input
                id="peopleCount"
                type="text"
                inputMode="numeric"
                value={peopleCount}
                onChange={(e) => setPeopleCount(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="e.g. 1 or 2"
                className="w-full rounded-none border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="note" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Short note (optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Student, quiet, pet-free"
              rows={2}
              className="w-full rounded-none border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-none border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!email.trim()}
              className="flex-1 rounded-none border border-zinc-400 dark:border-zinc-600 bg-zinc-950 dark:bg-white px-3 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add my pin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
