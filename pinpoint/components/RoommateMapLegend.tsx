"use client";

const ROOMMATE_LEGEND_ITEMS: {
  key: string;
  label: string;
  bg: string;
  glow: string;
}[] = [
  { key: "looking-for-room-and-roommate", label: "Looking for room + roommate", bg: "#ef4444", glow: "rgba(239,68,68,0.35)" },
  { key: "have-room-need-roommates", label: "Have room, need people", bg: "#3b82f6", glow: "rgba(59,130,246,0.35)" },
  { key: "sublet-room", label: "Subletting a room", bg: "#8b5cf6", glow: "rgba(139,92,246,0.35)" },
  { key: "me", label: "You (pinned)", bg: "#eab308", glow: "rgba(234,179,8,0.45)" },
];

export function RoommateMapLegend() {
  return (
    <div
      className="fixed top-4 right-4 z-30 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm px-3 py-2.5"
      aria-label="Map legend"
    >
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
        Roommate types
      </p>
      <ul className="space-y-1.5">
        {ROOMMATE_LEGEND_ITEMS.map(({ key, label, bg, glow }) => (
          <li key={key} className="flex items-center gap-2">
            <span
              className="shrink-0 w-3 h-3 rounded-full border border-white dark:border-zinc-800"
              style={{
                background: bg,
                boxShadow: `0 0 4px 2px ${glow}`,
              }}
              aria-hidden
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
