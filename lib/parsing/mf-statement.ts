import OpenAI from "openai";
import { buildMFStatementPrompt } from "@/lib/prompts/parsing-prompts";
import type { MFStatementParsed } from "@/lib/types/documents";

const client = new OpenAI();
const MAX_TEXT = 12000;

export async function parseMFStatement(
  text: string
): Promise<MFStatementParsed> {
  console.log(`[PARSE:mf] Starting, text: ${text.length} chars`);

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildMFStatementPrompt() },
      { role: "user", content: text.slice(0, MAX_TEXT) },
    ],
    temperature: 0,
    max_tokens: 4000,
  });

  console.log(
    `[PARSE:mf] OK, tokens: ${response.usage?.total_tokens}, finish: ${response.choices[0]?.finish_reason}`
  );

  const content = response.choices[0].message.content || "{}";
  const cleaned = content
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/,\s*([}\]])/g, "$1");

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in GPT response");

  const parsed = JSON.parse(jsonMatch[0]);
  console.log(`[PARSE:mf] Parsed ${(parsed.funds || []).length} funds`);
  return parsed as MFStatementParsed;
}
