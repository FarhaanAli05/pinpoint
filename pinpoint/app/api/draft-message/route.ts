import { NextRequest, NextResponse } from "next/server";

// Mock AI message generation — in production this would call an LLM API
export async function POST(req: NextRequest) {
  const { pin, unit } = await req.json();

  const memberCount = unit?.members?.length ?? 1;
  const budget = unit ? `$${unit.budgetMin}–$${unit.budgetMax}/mo` : "flexible";
  const moveIn = unit?.moveInMonth ?? "ASAP";

  const message = `Hi there!

I'm a student at Queen's University and I${memberCount > 1 ? `, along with ${memberCount - 1} roommate${memberCount > 1 ? "s" : ""}` : ""}, am looking for housing starting ${moveIn}.

I came across your listing for "${pin.title}" at ${pin.address} ($${pin.rent}/mo) and it looks like a great fit for ${memberCount > 1 ? "our group" : "me"}.

${memberCount > 1 ? `Our combined budget is around ${budget} per person, and we` : `My budget is around ${budget}, and I`} would love to schedule a viewing if it's still available.

${unit?.dealbreakers?.length ? `A few things that are important to ${memberCount > 1 ? "us" : "me"}: ${unit.dealbreakers.map((d: string) => d.replace("-", " ")).join(", ")}.` : ""}

Looking forward to hearing from you!

Best regards`;

  return NextResponse.json({ message });
}
