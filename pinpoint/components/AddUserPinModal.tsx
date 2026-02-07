"use client";

import { useState } from "react";
import { Pin } from "@/lib/types";

type UserPinType = "need-room" | "need-roommates";

interface AddUserPinModalProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onSubmit: (pin: Pin) => void;
}

export function AddUserPinModal({ lat, lng, onClose, onSubmit }: AddUserPinModalProps) {
  const [type, setType] = useState<UserPinType>("need-room");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const pin: Pin = {
      id: `user-${Date.now()}`,
      lat,
      lng,
      rent: 0,
      moveInDate: new Date().toISOString().slice(0, 10),
      type: "room",
      category: "looking-for-roommates",
      title: type === "need-room" ? "Looking for a room here" : "Looking for roommates in this area",
      description: note.trim() || (type === "need-room" ? "User is looking for a room in this area. Contact by email." : "User is looking for roommates in this area. Contact by email."),
      address: "Selected on map",
      bedrooms: 1,
      features: [],
      contactEmail: email.trim(),
      areaLabel: "Added by user (double-click on map)",
      sourceType: "user-added",
      createdAt: Date.now(),
    };
    onSubmit(pin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-mono text-lg font-semibold text-zinc-950 dark:text-white mb-1">
          Add yourself on the map
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Double-clicked location. Others will see your pin and can email you.
        </p>

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
            <label htmlFor="email" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Email (so people can contact you)
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
            <label htmlFor="note" className="block text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Short note (optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Student, Sept move-in, budget ~$700"
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
