import OpenAI from "openai";
import type { ConversationState } from "@/lib/types/conversation";
import { buildExtractionPrompt } from "@/lib/prompts/extraction-prompt";
import type { ExtractionResult } from "@/lib/state/merge";

const client = new OpenAI();

/**
 * Extract structured data from the user's message.
 *
 * CRITICAL: We include the assistant's preceding question alongside the user's
 * answer. Without this context, bare responses like "100000", "Yes", "Renting"
 * are uninterpretable — the model can't know if "100000" is salary, expenses,
 * or investment value.
 */
export async function extractStructuredData(
  userMessage: string,
  state: ConversationState,
  precedingAssistantMessage?: string
): Promise<ExtractionResult> {
  // Skip extraction for system triggers
  if (userMessage === "[SESSION_START]") {
    return { extractedFields: {} };
  }

  // Build the user content with context from Ria's question
  let contentForExtraction = userMessage;
  if (precedingAssistantMessage) {
    contentForExtraction = `Ria (advisor) asked: "${precedingAssistantMessage}"\n\nUser replied: "${userMessage}"`;
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildExtractionPrompt(state) },
        { role: "user", content: contentForExtraction },
      ],
      temperature: 0,
      max_tokens: 1000,
    });

    const parsed = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    // Separate sophistication signals from extracted fields
    const { sophisticationSignals, ...extractedFields } = parsed;

    const fieldCount = Object.keys(extractedFields).length;
    if (fieldCount > 0) {
      console.log(
        `[EXTRACT] ${fieldCount} fields from "${userMessage.substring(0, 50)}": ${Object.keys(extractedFields).join(", ")}`
      );
    }

    return {
      extractedFields,
      sophisticationSignals: sophisticationSignals || undefined,
    };
  } catch (error) {
    console.error("[EXTRACT] Failed:", error);
    return { extractedFields: {} };
  }
}
