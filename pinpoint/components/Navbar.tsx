"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context";

export function Navbar() {
  const pathname = usePathname();
  const { unit } = useApp();

  // Hide navbar on landing page and map page (map has its own rail)
  if (pathname === "/" || pathname === "/map") return null;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-md">
      <Link href="/" className="font-mono text-lg font-bold text-primary">
        Pinpoint
      </Link>
      <div className="flex items-center gap-4 text-sm font-medium">
        <NavLink href="/map" current={pathname}>
          Map
        </NavLink>
        <NavLink href="/tracker" current={pathname}>
          Tracker
        </NavLink>
        <NavLink href="/roommates" current={pathname}>
          Roommates
        </NavLink>
        {unit && (
          <span className="rounded-full bg-primary-light px-3 py-1 text-xs text-primary">
            {unit.members.length} member{unit.members.length !== 1 && "s"}
          </span>
        )}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: string;
  children: React.ReactNode;
}) {
  const isActive = current === href;
  return (
    <Link
      href={href}
      className={`transition-colors ${
        isActive
          ? "text-primary"
          : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
