import OpenAI from "openai";
import { buildBankStatementPrompt } from "@/lib/prompts/parsing-prompts";
import type { BankStatementParsed } from "@/lib/types/documents";

const client = new OpenAI();

/**
 * Parse a bank statement using GPT-4o vision.
 * Accepts either a raw PDF buffer OR pre-decoded base64 PNG images.
 * Pre-decoded images come from client-side decryption of password-protected PDFs.
 */
export async function parseBankStatement(
  pdfBuffer: Buffer | null,
  base64Images: string[] | null = null
): Promise<BankStatementParsed> {
  console.log(
    `[PARSE:bank] Starting, mode=${base64Images ? `images(${base64Images.length})` : `pdf(${pdfBuffer ? Math.round(pdfBuffer.length / 1024) : 0}KB)`}`
  );

  try {
    // Build content parts — either from pre-decoded images or by uploading PDF
    let contentParts: OpenAI.Chat.Completions.ChatCompletionContentPart[];

    if (base64Images && base64Images.length > 0) {
      // Pre-decoded images from client-side PDF rendering
      contentParts = base64Images.map((b64) => ({
        type: "image_url" as const,
        image_url: { url: `data:image/png;base64,${b64}` },
      }));
    } else if (pdfBuffer) {
      // Upload PDF to OpenAI Files API
      const blob = new Blob([new Uint8Array(pdfBuffer)], {
        type: "application/pdf",
      });
      const file = await client.files.create({
        file: new File([blob], "bank_statement.pdf", {
          type: "application/pdf",
        }),
        purpose: "assistants",
      });
      console.log(`[PARSE:bank] File uploaded: ${file.id}`);
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
        { role: "system", content: buildBankStatementPrompt() },
        { role: "user", content: contentParts },
      ],
      temperature: 0,
      max_tokens: 4000,
    });

    console.log(
      `[PARSE:bank] OK, tokens: ${response.usage?.total_tokens}, finish: ${response.choices[0]?.finish_reason}`
    );

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    console.log(`[PARSE:bank] Fields: ${Object.keys(parsed).join(", ")}`);
    return parsed as BankStatementParsed;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[PARSE:bank] FAILED:`, error.message);
    throw error;
  }
}
