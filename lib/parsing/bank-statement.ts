import OpenAI from "openai";
import { buildBankStatementPrompt } from "@/lib/prompts/parsing-prompts";
import type { BankStatementParsed } from "@/lib/types/documents";

const client = new OpenAI();

export async function parseBankStatement(
  pdfBuffer: Buffer
): Promise<BankStatementParsed> {
  const fileSizeKB = Math.round(pdfBuffer.length / 1024);
  console.log(`[PARSE:bank] Starting, PDF: ${fileSizeKB}KB`);

  try {
    // Upload file to OpenAI Files API first, then reference by file_id.
    // The inline file_data approach returns 500 errors intermittently.
    const blob = new Blob([new Uint8Array(pdfBuffer)], {
      type: "application/pdf",
    });
    const file = await client.files.create({
      file: new File([blob], "bank_statement.pdf", {
        type: "application/pdf",
      }),
      purpose: "assistants",
    });

    console.log(`[PARSE:bank] File uploaded to OpenAI: ${file.id}`);

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
              file: { file_id: file.id },
            },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 4000,
    });

    console.log(
      `[PARSE:bank] OK, tokens: ${response.usage?.total_tokens}, finish: ${response.choices[0]?.finish_reason}`
    );

    // Clean up the uploaded file
    try {
      await client.files.delete(file.id);
    } catch {
      // Non-fatal — file will auto-expire
    }

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
