"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/SessionProvider";

/** Head/avatar icon in the top-right corner linking to person profile (preferences). */
export function TopRightProfileLink() {
  const pathname = usePathname();
  const { data: session } = useSession();
  // Hide on the landing page and when not signed in
  if (!session || pathname === "/") return null;

  const isActive = pathname === "/dashboard/person-profile";

  return (
    <Link
      href="/dashboard/person-profile"
      aria-label="Your preferences"
      title="Your preferences"
      className={`fixed top-4 right-4 z-40 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
        isActive
          ? "border-zinc-500 dark:border-zinc-400 bg-zinc-200 dark:bg-zinc-700 text-zinc-950 dark:text-white"
          : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-500 dark:hover:border-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </Link>
  );
}
