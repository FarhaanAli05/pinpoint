"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { useSession } from "@/components/SessionProvider";

const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const LogOutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);
const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export function LeftSidebar() {
  const pathname = usePathname();
  const isMap = pathname === "/map" || pathname.startsWith("/listings") || pathname.startsWith("/roommates");
  const { theme, toggleTheme } = useTheme();
  const { data: session, signOut: doSignOut } = useSession();

  // Hide sidebar on the landing page and auth routes
  if (pathname === "/" || pathname.startsWith("/auth")) return null;

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-16 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col items-center py-4 gap-4">
      <Link
        href="/"
        aria-label="Go to homepage"
        className="mb-4 p-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
      >
        <LogoIcon />
      </Link>
      <div className="mt-2 flex flex-col gap-1">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex items-center justify-center w-12 h-12 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
        <Link
          href="/"
          aria-label="Home"
          className={`flex items-center justify-center w-12 h-12 rounded-md border transition-colors ${
            pathname === "/"
              ? "border-zinc-400 dark:border-zinc-700 bg-zinc-200 dark:bg-white/10 text-zinc-950 dark:text-white"
              : "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white"
          }`}
        >
          <HomeIcon />
        </Link>
        <Link
          href="/listings"
          aria-label="Listings"
          className={`flex items-center justify-center w-12 h-12 rounded-md border transition-colors ${
            pathname.startsWith("/listings") ? "border-zinc-400 dark:border-zinc-700 bg-zinc-200 dark:bg-white/10 text-zinc-950 dark:text-white" : "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white"
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" x2="21" y1="6" y2="6" />
            <line x1="8" x2="21" y1="12" y2="12" />
            <line x1="8" x2="21" y1="18" y2="18" />
            <line x1="3" x2="3.01" y1="6" y2="6" />
            <line x1="3" x2="3.01" y1="12" y2="12" />
            <line x1="3" x2="3.01" y1="18" y2="18" />
          </svg>
        </Link>
        <Link
          href="/roommates"
          aria-label="Roommates"
          className={`flex items-center justify-center w-12 h-12 rounded-md border transition-colors ${
            pathname.startsWith("/roommates") ? "border-zinc-400 dark:border-zinc-700 bg-zinc-200 dark:bg-white/10 text-zinc-950 dark:text-white" : "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white"
          }`}
        >
          <MapPinIcon />
        </Link>
        {session && (
          <Link
            href="/dashboard/profile"
            aria-label="View profile"
            title="View & edit profile"
            className={`flex items-center justify-center w-12 h-12 rounded-none border transition-colors ${
              pathname === "/dashboard/profile" ? "border-zinc-400 dark:border-zinc-700 bg-zinc-200 dark:bg-white/10 text-zinc-950 dark:text-white" : "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        )}
        {session ? (
          <button
            type="button"
            onClick={() => doSignOut({ callbackUrl: "/auth/signin" })}
            aria-label="Sign out"
            title="Sign out"
            className="flex items-center justify-center w-12 h-12 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors mt-2"
          >
            <LogOutIcon />
          </button>
        ) : (
          <Link
            href="/auth/signin?callbackUrl=/onboard"
            aria-label="Sign in"
            className="flex items-center justify-center w-12 h-12 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors mt-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        )}
      </div>
    </aside>
  );
}
