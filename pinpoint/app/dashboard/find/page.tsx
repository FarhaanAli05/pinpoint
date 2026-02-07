"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserIntent } from "@/lib/types";

const INTENTS: { value: UserIntent; label: string; description: string }[] = [
  {
    value: "looking-for-room",
    label: "I'm looking for a room or flat",
    description: "Show me sublets and places I can rent — I'll contact by email.",
  },
  {
    value: "have-sublet",
    label: "I have a place to sublet",
    description: "I'm listing my room or flat. Show me the full map (add listing coming soon).",
  },
  {
    value: "need-roommates",
    label: "I found a place and need roommates",
    description: "I have a link to a flat — I need people to share it with. Show others like me.",
  },
  {
    value: "searching-with-mates",
    label: "I'm searching for an apartment and need roommates",
    description: "I don't have a place yet. Show me people looking for roommates + available rooms.",
  },
];

export default function FindPage() {
  const router = useRouter();

  const handleSelect = (intent: UserIntent) => {
    router.push(`/map?intent=${intent}`);
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" data-theme="app">
      <div className="pl-16">
        <div className="max-w-xl mx-auto py-12 px-6">
          <h1 className="font-mono text-2xl font-semibold text-zinc-950 dark:text-white mb-2">
            What do you need?
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8">
            Pick one — we'll filter the map to what fits you.
          </p>

          <div className="space-y-3">
            {INTENTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="w-full text-left rounded-none border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
              >
                <p className="font-medium text-zinc-950 dark:text-white group-hover:text-zinc-950 dark:group-hover:text-white">
                  {opt.label}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{opt.description}</p>
              </button>
            ))}
          </div>

          <p className="text-center text-zinc-500 text-sm mt-8">
            <Link href="/map" className="underline hover:text-zinc-700 dark:hover:text-zinc-400">
              Skip and view full map
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
