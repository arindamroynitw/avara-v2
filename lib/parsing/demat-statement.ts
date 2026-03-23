import OpenAI from "openai";
import { buildDematStatementPrompt } from "@/lib/prompts/parsing-prompts";
import type { DematStatementParsed } from "@/lib/types/documents";

const client = new OpenAI();

export async function parseDematStatement(
  pdfBuffer: Buffer | null,
  base64Images: string[] | null = null
): Promise<DematStatementParsed> {
  console.log(
    `[PARSE:demat] Starting, mode=${base64Images ? `images(${base64Images.length})` : `pdf(${pdfBuffer ? Math.round(pdfBuffer.length / 1024) : 0}KB)`}`
  );

  try {
    let contentParts: OpenAI.Chat.Completions.ChatCompletionContentPart[];

    if (base64Images && base64Images.length > 0) {
      contentParts = base64Images.map((b64) => ({
        type: "image_url" as const,
        image_url: { url: `data:image/png;base64,${b64}` },
      }));
    } else if (pdfBuffer) {
      const blob = new Blob([new Uint8Array(pdfBuffer)], {
        type: "application/pdf",
      });
      const file = await client.files.create({
        file: new File([blob], "demat_statement.pdf", {
          type: "application/pdf",
        }),
        purpose: "assistants",
      });
      console.log(`[PARSE:demat] File uploaded: ${file.id}`);
      contentParts = [
        { type: "file" as const, file: { file_id: file.id } },
      ] as unknown as OpenAI.Chat.Completions.ChatCompletionContentPart[];
    } else {
      throw new Error("No PDF buffer or images provided");
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildDematStatementPrompt() },
        { role: "user", content: contentParts },
      ],
      temperature: 0,
      max_tokens: 4000,
    });

    console.log(
      `[PARSE:demat] OK, tokens: ${response.usage?.total_tokens}, finish: ${response.choices[0]?.finish_reason}`
    );

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    console.log(
      `[PARSE:demat] Parsed ${(parsed.holdings || []).length} holdings`
    );
    return parsed as DematStatementParsed;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[PARSE:demat] FAILED:`, error.message);
    throw error;
  }
}
