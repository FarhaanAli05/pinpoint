import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Catches stray ?code= params on pages other than /auth/callback.
 * This happens when Supabase falls back to its Site URL (e.g. /?code=...)
 * instead of our intended /auth/callback?code=... redirect.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    // Preserve code and any other params (next, etc.)
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Only run on pages that might receive a stray ?code= param.
  // Exclude static assets, API routes (they handle their own params), and _next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
