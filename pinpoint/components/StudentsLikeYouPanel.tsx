"use client";

import { STUDENT_PROFILES } from "@/lib/student-profiles";
import type { StudentProfile } from "@/lib/student-profiles";

interface StudentsLikeYouPanelProps {
  onClose: () => void;
  selectedProfile: StudentProfile | null;
  onSelectProfile: (profile: StudentProfile | null) => void;
  showAiAnalyzed?: boolean;
}

export function StudentsLikeYouPanel({
  onClose,
  selectedProfile,
  onSelectProfile,
  showAiAnalyzed = false,
}: StudentsLikeYouPanelProps) {
  return (
    <aside className="fixed left-16 top-0 bottom-0 z-40 w-72 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden animate-slide-in-left">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-mono text-sm font-semibold text-zinc-950 dark:text-white">
            {showAiAnalyzed ? "AI match" : "Students like you"}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {showAiAnalyzed
              ? "AI analyzed your preferences and found these matches."
              : "Similar needs — potential roommates. Click to see details."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1.5 rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close panel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {STUDENT_PROFILES.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => onSelectProfile(profile)}
            className="w-full text-left rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-start gap-2">
              <div className="w-9 h-9 rounded-none bg-zinc-400 dark:bg-zinc-700 flex items-center justify-center text-white text-sm font-medium shrink-0">
                {profile.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-950 dark:text-white text-sm">{profile.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{profile.budget} · {profile.moveIn}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">{profile.note}</p>
                {profile.prefs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {profile.prefs.map((p) => (
                      <span
                        key={p}
                        className="rounded-none bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:text-zinc-400"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-zinc-500 text-xs">View →</span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
