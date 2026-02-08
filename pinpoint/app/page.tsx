"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-zinc-100 dark:bg-[#0A0A0A] relative overflow-hidden">
      <nav className="relative z-20 flex items-center justify-between px-8 py-6">
        <Link
          href="/"
          aria-label="Pinpoint home"
          className="flex items-center gap-2 text-zinc-950 dark:text-white font-semibold text-lg"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-none border border-zinc-300 dark:border-zinc-800 bg-zinc-200 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          Pinpoint
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/listings/map" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors">
            Browse map
          </Link>
          <Link href="/auth/signin?callbackUrl=/onboard" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors">
            Sign in
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-88px)] px-4 text-center">
        <h1 className="font-mono text-5xl md:text-6xl lg:text-7xl text-zinc-950 dark:text-white mb-4 tracking-tight text-balance">
          Room & roommates
          <br />
          on one map
        </h1>
        <p className="text-zinc-600 dark:text-white/60 text-base md:text-lg max-w-md mb-8">
          Find a place and people to share it with. One flow.
        </p>
        <Link
          href="/listings/map"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Browse the map (no sign-in required)
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <p className="mt-4 text-sm text-zinc-500 dark:text-white/50">
          Sign in optional —{" "}
          <Link href="/auth/signin?callbackUrl=/onboard" className="underline hover:text-zinc-700 dark:hover:text-white/70">
            sign in with Google
          </Link>
          {" "}to add pins, save preferences, and use AI match.
        </p>
      </main>
    </div>
  );
}
