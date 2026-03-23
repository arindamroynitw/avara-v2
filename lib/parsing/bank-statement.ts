import OpenAI from "openai";
import { buildBankStatementPrompt } from "@/lib/prompts/parsing-prompts";
import type { BankStatementParsed } from "@/lib/types/documents";

const client = new OpenAI();
const MAX_TEXT = 12000; // Cap input like Sorted does

/**
 * Parse a bank statement from extracted text.
 * Text was already extracted client-side from the PDF by pdfjs-dist.
 */
export async function parseBankStatement(
  text: string
): Promise<BankStatementParsed> {
  console.log(`[PARSE:bank] Starting, text: ${text.length} chars`);

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildBankStatementPrompt() },
      { role: "user", content: text.slice(0, MAX_TEXT) },
    ],
    temperature: 0,
    max_tokens: 4000,
  });

  console.log(
    `[PARSE:bank] OK, tokens: ${response.usage?.total_tokens}, finish: ${response.choices[0]?.finish_reason}`
  );

  const content = response.choices[0].message.content || "{}";
  // Clean common GPT JSON issues (from Sorted's cleanedJson logic)
  const cleaned = content
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/,\s*([}\]])/g, "$1");

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in GPT response");

  const parsed = JSON.parse(jsonMatch[0]);
  console.log(`[PARSE:bank] Fields: ${Object.keys(parsed).join(", ")}`);
  return parsed as BankStatementParsed;
}
