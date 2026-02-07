import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { pin, unit } = await req.json();

  const memberCount = unit?.members?.length ?? 1;
  const budget = unit ? `$${unit.budgetMin}–$${unit.budgetMax}/mo` : "flexible";
  const moveIn = unit?.moveInMonth ?? "ASAP";

  // Build context for Gemini
  const prompt = `Write a polite, concise outreach message from a Queen's University student to a landlord about a housing listing.

LISTING DETAILS (use only these facts):
- Title: ${pin.title}
- Address: ${pin.address}
- Rent: $${pin.rent}/mo
- Type: ${pin.type === "whole-unit" ? "Whole unit" : "Room"}
- Move-in date: ${pin.moveInDate}
- Bedrooms: ${pin.bedrooms}
- Description: ${pin.description || "Not provided"}
- Features: ${pin.features?.length ? pin.features.join(", ") : "Not listed"}

STUDENT GROUP DETAILS:
- Number of people: ${memberCount}
- Budget range: ${budget}
- Desired move-in: ${moveIn}
- Dealbreakers: ${unit?.dealbreakers?.length ? unit.dealbreakers.map((d: string) => d.replace("-", " ")).join(", ") : "None specified"}

RULES:
- Do NOT invent any details not provided above.
- If important details are unclear (e.g., whether utilities are included, parking availability), include 1–2 short clarifying questions at the end.
- Keep the message warm but professional. Under 150 words.
- Reference the listing title and address.
- Mention the group size and move-in timing.
- Return ONLY the message text, no subject line or metadata.`;

  const geminiMessage = await generateText(prompt);

  if (geminiMessage) {
    return NextResponse.json({ message: geminiMessage });
  }

  // Fallback to template if Gemini fails
  const message = `Hi there!

I'm a student at Queen's University and I${memberCount > 1 ? `, along with ${memberCount - 1} roommate${memberCount > 1 ? "s" : ""}` : ""}, am looking for housing starting ${moveIn}.

I came across your listing for "${pin.title}" at ${pin.address} ($${pin.rent}/mo) and it looks like a great fit for ${memberCount > 1 ? "our group" : "me"}.

${memberCount > 1 ? `Our combined budget is around ${budget} per person, and we` : `My budget is around ${budget}, and I`} would love to schedule a viewing if it's still available.

${unit?.dealbreakers?.length ? `A few things that are important to ${memberCount > 1 ? "us" : "me"}: ${unit.dealbreakers.map((d: string) => d.replace("-", " ")).join(", ")}.` : ""}

Looking forward to hearing from you!

Best regards`;

  return NextResponse.json({ message });
}
