import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = ["media.kijiji.ca"];
const KIJIJI_REFERER = "https://www.kijiji.ca/";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

async function fetchImage(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: KIJIJI_REFERER,
      },
      next: { revalidate: 3600 },
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/image-proxy?url=https://media.kijiji.ca/...
 * Proxies Kijiji images with proper headers. Tries ?rule=kijijica-960-jpg if original 404s.
 */
export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(urlParam);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(url.hostname)) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  let res = await fetchImage(urlParam);
  if (!res && !url.searchParams.has("rule")) {
    const withRule = urlParam.includes("?")
      ? `${urlParam}&rule=kijijica-960-jpg`
      : `${urlParam}?rule=kijijica-960-jpg`;
    res = await fetchImage(withRule);
  }

  if (!res) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
