import OpenAI from "openai";
import { buildMFStatementPrompt } from "@/lib/prompts/parsing-prompts";
import type { MFStatementParsed } from "@/lib/types/documents";

const client = new OpenAI();

export async function parseMFStatement(
  pdfBuffer: Buffer
): Promise<MFStatementParsed> {
  const fileSizeKB = Math.round(pdfBuffer.length / 1024);
  console.log(`[PARSE:mf] Starting, PDF: ${fileSizeKB}KB`);

  try {
    // Upload file to OpenAI Files API first, then reference by file_id.
    const blob = new Blob([new Uint8Array(pdfBuffer)], {
      type: "application/pdf",
    });
    const file = await client.files.create({
      file: new File([blob], "mf_statement.pdf", {
        type: "application/pdf",
      }),
      purpose: "assistants",
    });

    console.log(`[PARSE:mf] File uploaded to OpenAI: ${file.id}`);

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
              file: { file_id: file.id },
            },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 4000,
    });

    console.log(
      `[PARSE:mf] OK, tokens: ${response.usage?.total_tokens}, finish: ${response.choices[0]?.finish_reason}`
    );

    // Clean up
    try {
      await client.files.delete(file.id);
    } catch {
      // Non-fatal
    }

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    console.log(`[PARSE:mf] Parsed ${(parsed.funds || []).length} funds`);
    return parsed as MFStatementParsed;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[PARSE:mf] FAILED:`, error.message);
    throw error;
  }
}
