"use client";

import type { StudentProfile } from "@/lib/student-profiles";

interface StudentProfileDetailPanelProps {
  profile: StudentProfile;
  onClose: () => void;
}

export function StudentProfileDetailPanel({ profile, onClose }: StudentProfileDetailPanelProps) {
  const mailto = `mailto:${profile.contactEmail}?subject=Roommate match from Pinpoint`;

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-full max-w-sm border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col shadow-2xl animate-slide-in-right">
      <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-none bg-zinc-400 dark:bg-zinc-700 flex items-center justify-center text-white text-lg font-medium shrink-0">
              {profile.name.slice(0, 1)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{profile.name}</h2>
              <p className="text-xs text-zinc-500">AI match — potential roommate</p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-2 rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Budget</p>
            <p className="text-sm font-semibold text-zinc-950 dark:text-white">{profile.budget}</p>
          </div>
          <div className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Move-in</p>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{profile.moveIn}</p>
          </div>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{profile.note}</p>

        {profile.prefs.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Preferences</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.prefs.map((p) => (
                <span
                  key={p}
                  className="rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
        <a
          href={mailto}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-none border border-zinc-300 dark:border-zinc-700 bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          Email to connect
        </a>
        <p className="text-xs text-zinc-500 mt-2 text-center truncate">{profile.contactEmail}</p>
      </div>
    </aside>
  );
}
