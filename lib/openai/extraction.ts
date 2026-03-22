import OpenAI from "openai";
import type { ConversationState } from "@/lib/types/conversation";
import { buildExtractionPrompt } from "@/lib/prompts/extraction-prompt";
import type { ExtractionResult } from "@/lib/state/merge";

const client = new OpenAI();

export async function extractStructuredData(
  userMessage: string,
  state: ConversationState
): Promise<ExtractionResult> {
  // Skip extraction for system triggers
  if (userMessage === "[SESSION_START]") {
    return { extractedFields: {} };
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildExtractionPrompt(state) },
        { role: "user", content: userMessage },
      ],
      temperature: 0,
      max_tokens: 1000,
    });

    const parsed = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    // Separate sophistication signals from extracted fields
    const { sophisticationSignals, ...extractedFields } = parsed;

    return {
      extractedFields,
      sophisticationSignals: sophisticationSignals || undefined,
    };
  } catch (error) {
    console.error("Extraction failed:", error);
    return { extractedFields: {} };
  }
}
