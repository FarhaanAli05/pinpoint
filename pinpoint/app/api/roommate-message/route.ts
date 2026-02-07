import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { myProfile, theirProfile } = await req.json();

  const prompt = `Write a short, friendly first message from one Queen's University student to a potential roommate.

SENDER PROFILE:
- Name: ${myProfile.name}
- Program: ${myProfile.program || "Not specified"}
- Budget: $${myProfile.budgetMin}–$${myProfile.budgetMax}/mo
- Move-in: ${myProfile.moveInMonth}
- Cleanliness: ${myProfile.cleanliness}
- Sleep schedule: ${myProfile.sleepSchedule}
- Guests preference: ${myProfile.guests}
- About: ${myProfile.aboutMe || "Not provided"}

RECIPIENT PROFILE:
- Name: ${theirProfile.name}
- Program: ${theirProfile.program || "Not specified"}
- Budget: $${theirProfile.budgetMin}–$${theirProfile.budgetMax}/mo
- Move-in: ${theirProfile.moveInMonth}
- Cleanliness: ${theirProfile.cleanliness}
- Sleep schedule: ${theirProfile.sleepSchedule}
- Guests preference: ${theirProfile.guests}
- About: ${theirProfile.aboutMe || "Not provided"}

RULES:
- Keep it under 80 words
- Be warm and casual — these are students
- Reference 1–2 specific things they have in common (budget overlap, same move-in month, similar lifestyle)
- Do NOT claim personality traits not stated in the profiles
- Do NOT invent facts
- Suggest meeting up or chatting more
- Return ONLY the message text`;

  const geminiMessage = await generateText(prompt);

  if (geminiMessage) {
    return NextResponse.json({ message: geminiMessage });
  }

  // Fallback
  const message = `Hey ${theirProfile.name}! I'm ${myProfile.name}, a Queen's student looking for a roommate around ${myProfile.moveInMonth}. Looks like we might be a good match — want to chat more about rooming together?`;

  return NextResponse.json({ message });
}
