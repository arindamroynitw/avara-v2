import OpenAI from "openai";
import { convertPdfToImages } from "./pdf-to-images";
import { buildMFStatementPrompt } from "@/lib/prompts/parsing-prompts";
import type { MFStatementParsed } from "@/lib/types/documents";

const client = new OpenAI();

export async function parseMFStatement(
  pdfBuffer: Buffer
): Promise<MFStatementParsed> {
  const images = await convertPdfToImages(pdfBuffer);

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildMFStatementPrompt() },
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
  return parsed as MFStatementParsed;
}
