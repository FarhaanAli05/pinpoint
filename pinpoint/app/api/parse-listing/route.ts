import { NextResponse } from "next/server";

/**
 * POST /api/parse-listing
 *
 * Accepts { url: string } and returns best-guess listing metadata.
 * Currently uses simple heuristics to extract info from the URL itself.
 * Designed to be swapped out for an LLM call (e.g. Gemini) later.
 */
export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid `url` field" },
        { status: 400 }
      );
    }

    // Detect source platform from hostname
    const sourceLabel = detectSourceLabel(url);

    // Stub extraction — returns best-effort guesses.
    // In production, this would call an LLM or a metadata-extraction service.
    const result: {
      title?: string;
      rent?: number;
      moveInDate?: string;
      sourceLabel: string;
    } = {
      sourceLabel,
      // No real extraction yet — the user confirms/edits in the modal
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse listing URL" },
      { status: 500 }
    );
  }
}

function detectSourceLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("facebook.com") || hostname.includes("fb.com"))
      return "Facebook Marketplace";
    if (hostname.includes("kijiji.ca")) return "Kijiji";
    if (hostname.includes("craigslist.org")) return "Craigslist";
    if (hostname.includes("rentals.ca")) return "Rentals.ca";
    if (hostname.includes("padmapper.com")) return "PadMapper";
    if (hostname.includes("realtor.ca")) return "Realtor.ca";
    if (hostname.includes("zumper.com")) return "Zumper";
    return hostname;
  } catch {
    return "External link";
  }
}
