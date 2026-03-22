import OpenAI from "openai";
import { buildMFStatementPrompt } from "@/lib/prompts/parsing-prompts";
import type { MFStatementParsed } from "@/lib/types/documents";

const client = new OpenAI();

export async function parseMFStatement(
  pdfBuffer: Buffer
): Promise<MFStatementParsed> {
  const base64 = pdfBuffer.toString("base64");

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildMFStatementPrompt() },
      {
        role: "user",
        content: [
          {
            type: "file" as const,
            file: {
              file_data: `data:application/pdf;base64,${base64}`,
              filename: "mf_statement.pdf",
            },
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 4000,
  });

  const parsed = JSON.parse(response.choices[0].message.content || "{}");
  return parsed as MFStatementParsed;
}
