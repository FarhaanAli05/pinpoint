import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_INSTRUCTION = `You are a helpful assistant for Pinpoint, a student housing search platform for Queen's University students in Kingston, ON.

CRITICAL RULES:
- NEVER invent, hallucinate, or assume facts not explicitly provided in the input.
- Only reference information that was directly given to you.
- If information is missing, say so or ask a clarifying question — do NOT fill in gaps with guesses.
- Be concise and practical. Students are busy.`;

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

export function getGeminiModel() {
  const client = getClient();
  return client.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });
}

/**
 * Generate text from Gemini with a timeout and error handling.
 * Returns null on failure so callers can fall back gracefully.
 */
export async function generateText(
  prompt: string,
  timeoutMs = 15000
): Promise<string | null> {
  try {
    const model = getGeminiModel();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    clearTimeout(timer);
    const text = result.response.text();
    return text || null;
  } catch (err) {
    console.error("[Gemini] generation failed:", err);
    return null;
  }
}

/**
 * Generate structured JSON from Gemini.
 * The prompt should instruct the model to output JSON only.
 * Returns the raw string for the caller to parse/validate with Zod.
 */
export async function generateJSON(
  prompt: string,
  timeoutMs = 20000
): Promise<string | null> {
  try {
    const model = getGeminiModel();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    clearTimeout(timer);
    const text = result.response.text();
    return text || null;
  } catch (err) {
    console.error("[Gemini] JSON generation failed:", err);
    return null;
  }
}
