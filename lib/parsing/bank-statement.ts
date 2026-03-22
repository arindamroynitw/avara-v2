import OpenAI from "openai";
import { buildBankStatementPrompt } from "@/lib/prompts/parsing-prompts";
import type { BankStatementParsed } from "@/lib/types/documents";

const client = new OpenAI();

export async function parseBankStatement(
  pdfBuffer: Buffer
): Promise<BankStatementParsed> {
  const base64 = pdfBuffer.toString("base64");

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildBankStatementPrompt() },
      {
        role: "user",
        content: [
          {
            type: "file" as const,
            file: {
              file_data: `data:application/pdf;base64,${base64}`,
              filename: "bank_statement.pdf",
            },
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 4000,
  });

  const parsed = JSON.parse(response.choices[0].message.content || "{}");
  return parsed as BankStatementParsed;
}
