import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/gemini";

const ListingSchema = z.object({
  title: z.string().optional(),
  rent: z.number().optional(),
  moveInDate: z.string().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  addressText: z.string().optional(),
  description: z.string().optional(),
  furnished: z.boolean().optional(),
  pets: z.enum(["allowed", "limited", "not_allowed", "unknown"]).optional(),
  features: z.array(z.string()).optional(),
  sourceLabel: z.string().optional(),
});

export type ParsedListing = z.infer<typeof ListingSchema>;

const MAX_TEXT_LENGTH = 30000;
const FETCH_TIMEOUT_MS = 10000;

export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid `url` field" },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const sourceLabel = detectSourceLabel(url);

    // Fetch the page content with timeout
    let pageText: string;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Pinpoint/1.0; student housing helper)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timer);

      if (!res.ok) {
        // If we can't fetch, return just the source label for manual entry
        return NextResponse.json({ sourceLabel });
      }

      const html = await res.text();
      pageText = cleanHtml(html);
    } catch (err) {
      console.error("[parse-listing] fetch failed:", err);
      // Graceful fallback — let the user fill in manually
      return NextResponse.json({ sourceLabel });
    }

    if (!pageText || pageText.length < 50) {
      return NextResponse.json({ sourceLabel });
    }

    // Cap the text to a safe limit
    const truncatedText = pageText.slice(0, MAX_TEXT_LENGTH);

    // Ask Gemini to extract structured listing data
    const prompt = `You are extracting rental listing metadata from a web page. The page was fetched from: ${url}

Here is the cleaned text content of the page:
---
${truncatedText}
---

Extract the following fields as JSON. Only include fields you can confidently determine from the text. Do NOT guess or hallucinate values.

Required JSON schema:
{
  "title": "string or omit — the listing title",
  "rent": "number or omit — monthly rent in CAD, just the number",
  "moveInDate": "string or omit — ISO date format (YYYY-MM-DD) if a specific date is mentioned",
  "bedrooms": "number or omit",
  "bathrooms": "number or omit",
  "addressText": "string or omit — the street address or location description",
  "description": "string or omit — a brief 1-2 sentence summary of the listing",
  "furnished": "boolean or omit",
  "pets": "'allowed' | 'limited' | 'not_allowed' | 'unknown' or omit",
  "features": "array of strings or omit — e.g. ['laundry', 'dishwasher', 'air conditioning', 'parking']",
  "sourceLabel": "${sourceLabel}"
}

Return ONLY valid JSON. No markdown, no explanation.`;

    const jsonStr = await generateJSON(prompt);

    if (!jsonStr) {
      return NextResponse.json({ sourceLabel });
    }

    // Parse and validate with Zod
    try {
      const raw = JSON.parse(jsonStr);
      const parsed = ListingSchema.parse(raw);
      // Always include sourceLabel even if Gemini missed it
      return NextResponse.json({ ...parsed, sourceLabel });
    } catch (err) {
      console.error("[parse-listing] JSON validation failed:", err);
      return NextResponse.json({ sourceLabel });
    }
  } catch (err) {
    console.error("[parse-listing] unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to parse listing URL" },
      { status: 500 }
    );
  }
}

/**
 * Strip scripts, styles, nav/footer noise from HTML and return clean text.
 */
function cleanHtml(html: string): string {
  let text = html;

  // Remove script and style tags and their content
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  // Remove nav, header, footer elements
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, " ");

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
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
