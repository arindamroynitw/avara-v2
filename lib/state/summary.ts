import { generateText } from "ai";
import { openai } from "@/lib/openai/client";

export async function generateRollingSummary(
  existingSummary: string,
  recentMessages: Array<{ role: string; content: string }>
): Promise<string> {
  const messagesText = recentMessages
    .map((m) => `${m.role === "assistant" ? "Ria" : "User"}: ${m.content}`)
    .join("\n");

  const prompt = `Summarize the following conversation between Ria (AI financial advisor) and the user.
Focus on: what was discussed, key data points shared, user's tone and sophistication level, and any notable moments.
${existingSummary ? `Incorporate and condense the existing summary:\n${existingSummary}\n` : ""}
Keep the total summary under 300 words.

Recent conversation:
${messagesText}`;

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
    temperature: 0,
    maxOutputTokens: 400,
  });

  return result.text;
}
