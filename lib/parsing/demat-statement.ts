import OpenAI from "openai";
import { buildDematStatementPrompt } from "@/lib/prompts/parsing-prompts";
import type { DematStatementParsed } from "@/lib/types/documents";

const client = new OpenAI();

export async function parseDematStatement(
  pdfBuffer: Buffer
): Promise<DematStatementParsed> {
  const base64 = pdfBuffer.toString("base64");
  const fileSizeKB = Math.round(pdfBuffer.length / 1024);

  console.log(`[PARSE:demat_statement] Starting parse, PDF size: ${fileSizeKB}KB, base64 length: ${base64.length}`);

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildDematStatementPrompt() },
        {
          role: "user",
          content: [
            {
              type: "file" as const,
              file: {
                file_data: `data:application/pdf;base64,${base64}`,
                filename: "demat_statement.pdf",
              },
            },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 4000,
    });

    console.log(`[PARSE:demat_statement] OpenAI response OK, tokens: ${response.usage?.total_tokens}, finish: ${response.choices[0]?.finish_reason}`);

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    console.log(`[PARSE:demat_statement] Parsed ${(parsed.holdings || []).length} holdings`);
    return parsed as DematStatementParsed;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[PARSE:demat_statement] FAILED:`, {
      message: error.message,
      name: error.name,
      ...(err && typeof err === "object" && "status" in err
        ? { status: (err as { status: number }).status }
        : {}),
      ...(err && typeof err === "object" && "code" in err
        ? { code: (err as { code: string }).code }
        : {}),
    });
    throw error;
  }
}
