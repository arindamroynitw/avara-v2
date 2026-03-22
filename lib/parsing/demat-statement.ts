import OpenAI from "openai";
import { convertPdfToImages } from "./pdf-to-images";
import { buildDematStatementPrompt } from "@/lib/prompts/parsing-prompts";
import type { DematStatementParsed } from "@/lib/types/documents";

const client = new OpenAI();

export async function parseDematStatement(
  pdfBuffer: Buffer
): Promise<DematStatementParsed> {
  const images = await convertPdfToImages(pdfBuffer);

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildDematStatementPrompt() },
      {
        role: "user",
        content: images.map((img) => ({
          type: "image_url" as const,
          image_url: { url: img },
        })),
      },
    ],
    temperature: 0,
    max_tokens: 4000,
  });

  const parsed = JSON.parse(response.choices[0].message.content || "{}");
  return parsed as DematStatementParsed;
}
