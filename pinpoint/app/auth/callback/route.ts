import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Returns immediately with a "Completing sign-in..." page so the user isn't
 * staring at a frozen tab. The page fetches /api/auth/complete-signin (which
 * does the slow Supabase code exchange) then redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboard";
  const origin = request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/signin?error=Could not sign in`, 303);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Signing in…</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui, sans-serif; background: #f4f4f5; color: #18181b; }
    .card { text-align: center; padding: 2rem; }
    .spinner { width: 40px; height: 40px; margin: 0 auto 1rem; border: 3px solid #e4e4e7; border-top-color: #18181b; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { margin: 0; font-size: 1rem; color: #52525b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner" aria-hidden="true"></div>
    <p>Completing sign-in…</p>
  </div>
  <script>
    (function() {
      var qs = window.location.search;
      fetch('/api/auth/complete-signin' + qs, { credentials: 'same-origin' })
        .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
        .then(function(_ref) {
          var ok = _ref.ok, data = _ref.data;
          var url = data.redirectUrl || (ok ? '/listings/map' : '/auth/signin?error=Could not sign in');
          window.location.replace(url);
        })
        .catch(function() { window.location.replace('/auth/signin?error=Could not sign in'); });
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
