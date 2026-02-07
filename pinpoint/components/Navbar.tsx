"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context";

export function Navbar() {
  const pathname = usePathname();
  const { unit } = useApp();

  // Hide navbar on landing page
  if (pathname === "/") return null;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-3 shadow-sm">
      <Link href="/" className="text-lg font-bold text-primary">
        Pinpoint
      </Link>
      <div className="flex items-center gap-4 text-sm font-medium">
        <NavLink href="/map" current={pathname}>
          Map
        </NavLink>
        <NavLink href="/tracker" current={pathname}>
          Tracker
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
