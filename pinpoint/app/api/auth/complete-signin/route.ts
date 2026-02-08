import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function toNextCookieOptions(opts: Record<string, unknown> | undefined) {
  if (!opts || typeof opts !== "object") return {};
  const o: Record<string, unknown> = {};
  if (typeof opts.path === "string") o.path = opts.path;
  if (typeof opts.maxAge === "number") o.maxAge = opts.maxAge;
  if (opts.expires instanceof Date) o.expires = opts.expires;
  if (typeof opts.httpOnly === "boolean") o.httpOnly = opts.httpOnly;
  if (typeof opts.secure === "boolean") o.secure = opts.secure;
  if (opts.sameSite === "lax" || opts.sameSite === "strict" || opts.sameSite === "none") o.sameSite = opts.sameSite;
  return o;
}

/**
 * Does the actual code-for-session exchange (slow). Called by the callback page
 * so the user sees "Completing sign-in..." immediately instead of a frozen tab.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // Always use the request origin so localhost stays localhost and prod stays prod.
  const origin = request.nextUrl.origin;

  if (!code) {
    return NextResponse.json({ error: "missing_code", redirectUrl: `${origin}/auth/signin?error=Could not sign in` }, { status: 400 });
  }

  const cookieStore = await cookies();
  const savedSetCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            savedSetCookies.push({ name, value, options: options ?? {} });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.json(
      { error: error.message, redirectUrl: `${origin}/auth/signin?error=Could not sign in` },
      { status: 400 }
    );
  }

  // Decide destination: new users → onboarding, returning users → /listings/map
  let path = "/listings/map";
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.onboarded_at) {
        path = "/onboarding";
      }
    }
  } catch {
    // If profile check fails, default to /listings/map (safe for returning users)
  }

  const redirectUrl = `${origin}${path}`;
  const res = NextResponse.json({ redirectUrl });
  savedSetCookies.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, toNextCookieOptions(options) as Parameters<typeof res.cookies.set>[2]);
  });
  return res;
}
