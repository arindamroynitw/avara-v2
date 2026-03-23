import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
import { openai } from "@/lib/openai/client";
import { buildSystemPrompt } from "@/lib/prompts/system-prompt";
import { createClient } from "@/lib/supabase/server";
import {
  loadConversationState,
  saveConversationState,
  incrementMessageCount,
  loadSummary,
  saveSummary,
} from "@/lib/state/manager";
import { saveMessage } from "@/lib/state/messages";
import { extractStructuredData } from "@/lib/openai/extraction";
import { mergeExtraction } from "@/lib/state/merge";
import { evaluateRules } from "@/lib/rules/engine";
import {
  isChapterComplete,
  isMinimumViableComplete,
  getMinimumViableMissing,
} from "@/lib/state/completeness";
import { commitChapterToProfile } from "@/lib/state/profile-sync";
import { generateRollingSummary } from "@/lib/state/summary";
import { DATA_SAFETY_FRAMING } from "@/lib/rules/chapter-transitions";

export const maxDuration = 60;

// Max messages to send to OpenAI (prevents unbounded context growth)
const MAX_MODEL_MESSAGES = 15;

export async function POST(req: Request) {
  const requestStart = Date.now();
  const elapsed = () => `${Date.now() - requestStart}ms`;

  // ── 1. Parse request ──
  let uiMessages: UIMessage[];
  try {
    const body = await req.json();
    uiMessages = body.messages;
  } catch (err) {
    console.error("[CHAT] Failed to parse request body:", err);
    return new Response("Invalid request body", { status: 400 });
  }

  // ── 2. Authenticate ──
  let userId: string;
  let userName: string;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("[CHAT] Unauthorized request");
      return new Response("Unauthorized", { status: 401 });
    }

    userId = user.id;

    const { data: userData } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .single();

    userName = userData?.full_name || "there";
  } catch (err) {
    console.error("[CHAT] Auth/user lookup failed:", err);
    return new Response("Authentication failed", { status: 500 });
  }

  // ── 3. Load state ──
  let conversationState;
  let summary: string;
  try {
    conversationState = await loadConversationState(userId);
    summary = await loadSummary(userId);
    console.log(`[CHAT] ${elapsed()} | State loaded`);
  } catch (err) {
    console.error("[CHAT] Failed to load conversation state:", err);
    return new Response("Failed to load conversation state", { status: 500 });
  }

  // ── 4. Get user's latest message + preceding assistant message for extraction context ──
  const lastUserMessage = uiMessages[uiMessages.length - 1];
  const userText =
    lastUserMessage?.parts
      ?.filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("") || "";

  // Find the last assistant message BEFORE the user's message — this is Ria's question
  // that gives context to bare answers like "100000", "Yes", "Renting"
  let precedingAssistantText: string | undefined;
  for (let i = uiMessages.length - 2; i >= 0; i--) {
    if (uiMessages[i].role === "assistant") {
      precedingAssistantText = uiMessages[i].parts
        ?.filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("") || undefined;
      break;
    }
  }

  console.log(
    `[CHAT] User ${userId.substring(0, 8)}... | Ch${conversationState.currentChapter} | "${userText.substring(0, 80)}${userText.length > 80 ? "..." : ""}" | ${uiMessages.length} client msgs`
  );

  // ── 5. Handle special triggers ──
  const docParsedMatch = userText.match(
    /^\[DOCUMENT_PARSED:(\w+):(.+)\]$/
  );
  const docFailedMatch = userText.match(/^\[DOCUMENT_FAILED:(\w+)\]$/);
  const voiceEndedMatch = userText.match(/^\[VOICE_ENDED:(.+)\]$/);

  let documentContext = "";
  try {
    const supabase = await createClient();

    if (docParsedMatch) {
      const [, docType, docId] = docParsedMatch;
      const { data: doc } = await supabase
        .from("uploaded_documents")
        .select("parsed_data, document_type")
        .eq("id", docId)
        .single();

      if (doc?.parsed_data) {
        documentContext = `\n\nIMPORTANT CONTEXT: The user just uploaded a ${docType.replace("_", " ")}. Here is the parsed data:\n${JSON.stringify(doc.parsed_data, null, 2)}\n\nSummarize the key findings naturally in conversation. Highlight the most important numbers (income, expenses, fund values, stock holdings). Ask the user to confirm if the data looks correct. Keep it conversational — don't dump the raw data.`;
      }
    }

    if (docFailedMatch) {
      const [, docType] = docFailedMatch;
      documentContext = `\n\nIMPORTANT CONTEXT: The user tried to upload a ${docType.replace("_", " ")} but parsing failed. Acknowledge the issue warmly and fall back to asking them to share the key details manually. For a bank statement, ask for: monthly salary credit amount, biggest regular expenses, any SIPs or EMIs.`;
    }

    if (voiceEndedMatch) {
      const [, sessionId] = voiceEndedMatch;
      const { data: voiceSession } = await supabase
        .from("voice_sessions")
        .select("summary, duration_seconds, extracted_data")
        .eq("id", sessionId)
        .single();

      if (voiceSession) {
        const mins = Math.floor((voiceSession.duration_seconds || 0) / 60);
        documentContext = `\n\nIMPORTANT CONTEXT: The user just finished a ${mins}-minute voice call with you. Here is a summary of what was covered: "${voiceSession.summary || "General financial discussion"}". The extracted data from the call has already been saved. Continue the conversation naturally from where the voice call left off. Acknowledge the call briefly (e.g., "Great call — I got a lot of useful context from that.") and then move forward with whatever is next in the chapter flow.`;
      }
    }
  } catch (err) {
    console.error("[CHAT] Error loading trigger context:", err);
  }

  const isSystemTrigger =
    userText === "[SESSION_START]" ||
    docParsedMatch ||
    docFailedMatch ||
    voiceEndedMatch;

  // Save user message to DB (skip system triggers)
  if (!isSystemTrigger) {
    try {
      await saveMessage(userId, {
        role: "user",
        content: userText,
        messageType: "text",
        chapter: conversationState.currentChapter,
      });
    } catch (err) {
      console.error("[CHAT] Failed to save user message:", err);
    }
  }

  // ── 6. Build system prompt ──
  const collectedSummaryParts: string[] = [];
  const missingSummaryParts: string[] = [];
  for (const [section, items] of Object.entries(conversationState.collected)) {
    for (const [key, val] of Object.entries(
      items as Record<string, boolean>
    )) {
      if (val) collectedSummaryParts.push(`${section}.${key}`);
      else missingSummaryParts.push(`${section}.${key}`);
    }
  }

  const lastActive = conversationState.lastActiveAt
    ? new Date(conversationState.lastActiveAt)
    : null;
  const isReturningUser =
    lastActive && Date.now() - lastActive.getTime() > 24 * 60 * 60 * 1000;

  conversationState.lastActiveAt = new Date().toISOString();
  if (isReturningUser && userText === "[SESSION_START]") {
    conversationState.sessionCount =
      (conversationState.sessionCount || 1) + 1;
  }

  const minViableComplete = isMinimumViableComplete(conversationState);
  conversationState.minimumViableComplete = minViableComplete;

  const systemPrompt =
    buildSystemPrompt({
      userName,
      currentChapter: conversationState.currentChapter,
      sophisticationTier: conversationState.sophisticationTier,
      collectedSummary: collectedSummaryParts.length
        ? `Already collected: ${collectedSummaryParts.join(", ")}`
        : undefined,
      missingSummary: missingSummaryParts.length
        ? `Still missing: ${missingSummaryParts.join(", ")}`
        : undefined,
      rollingSummary: summary || undefined,
      isReturningUser: !!(isReturningUser && userText === "[SESSION_START]"),
      minimumViableComplete: minViableComplete,
      minimumViableMissing: minViableComplete
        ? undefined
        : getMinimumViableMissing(conversationState),
    }) + documentContext;

  // ── 7. Convert messages for model — TRIM to last N ──
  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(uiMessages);
  } catch (err) {
    console.error("[CHAT] Failed to convert messages:", err);
    return new Response("Failed to process messages", { status: 500 });
  }

  // FIX: Trim to last MAX_MODEL_MESSAGES to prevent unbounded context growth.
  // The rolling summary provides context for older messages.
  const originalCount = modelMessages.length;
  if (modelMessages.length > MAX_MODEL_MESSAGES) {
    modelMessages = modelMessages.slice(-MAX_MODEL_MESSAGES);
  }

  // ── 8. Fire parallel calls ──
  console.log(
    `[CHAT] ${elapsed()} | Calling OpenAI | prompt: ${systemPrompt.length} chars | msgs: ${modelMessages.length} (trimmed from ${originalCount}) | collected: ${collectedSummaryParts.length}/${collectedSummaryParts.length + missingSummaryParts.length}`
  );

  const streamPromise = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: modelMessages,
    temperature: 0.7,
    maxOutputTokens: 1200, // FIX: increased from 800 to avoid truncation on longer responses
  });

  const extractionPromise = isSystemTrigger
    ? Promise.resolve({ extractedFields: {} })
    : extractStructuredData(userText, conversationState, precedingAssistantText);

  // ── 9. Create UI message stream ──
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      try {
        // Stream Ria's response
        const result = await streamPromise;
        writer.merge(result.toUIMessageStream());

        console.log(`[CHAT] ${elapsed()} | OpenAI stream merged`);

        // Wait for extraction (runs in parallel with streaming)
        const extraction = await extractionPromise;

        console.log(
          `[CHAT] ${elapsed()} | Extraction: ${Object.keys(extraction.extractedFields).length} fields [${Object.keys(extraction.extractedFields).join(", ") || "none"}]`
        );

        // Merge extraction into state
        const messageCount = await incrementMessageCount(userId);
        const updatedState = mergeExtraction(
          conversationState,
          extraction,
          messageCount
        );

        // Check chapter transitions
        let chapterTransitioned = false;
        if (
          isChapterComplete(updatedState, updatedState.currentChapter) &&
          updatedState.currentChapter < 4 &&
          !updatedState.chapterCompletedAt[updatedState.currentChapter]
        ) {
          console.log(
            `[CHAT] Chapter ${updatedState.currentChapter} complete → ${updatedState.currentChapter + 1}`
          );

          try {
            await commitChapterToProfile(userId, extraction.extractedFields);
          } catch (err) {
            console.error("[CHAT] Chapter commit failed:", err);
          }

          updatedState.chapterCompletedAt[updatedState.currentChapter] =
            new Date().toISOString();
          const nextChapter = (updatedState.currentChapter + 1) as 1 | 2 | 3 | 4;
          updatedState.chapterStartedAt[nextChapter] = new Date().toISOString();

          if (updatedState.currentChapter === 1) {
            writer.write({
              type: "text" as const,
              text: "\n\n---\n\n" + DATA_SAFETY_FRAMING,
            } as never);
          }

          updatedState.currentChapter = nextChapter;
          chapterTransitioned = true;
        }

        // Load profile + assets for insight evaluation
        const supabase = await createClient();
        const [profileRes, assetsRes] = await Promise.all([
          supabase
            .from("financial_profiles")
            .select("*")
            .eq("user_id", userId)
            .single(),
          supabase.from("assets").select("*").eq("user_id", userId),
        ]);

        // Count real user messages
        const realUserMessages = uiMessages.filter(
          (m) =>
            m.role === "user" &&
            !m.parts?.some(
              (p) =>
                p.type === "text" &&
                (p as { type: "text"; text: string }).text.startsWith("[")
            )
        );

        // Evaluate rules engine
        const { components } = evaluateRules(updatedState, extraction, {
          profile: profileRes.data,
          assets: assetsRes.data || [],
          isFirstAssistantMessage: userText === "[SESSION_START]",
          userMessageCount: realUserMessages.length,
        });

        if (components.length > 0) {
          console.log(
            `[CHAT] ${elapsed()} | Injecting ${components.length} components: ${components.map((c) => c.type).join(", ")}`
          );
        }

        // Write component injections
        for (const component of components) {
          writer.write({
            type: `data-${component.type}`,
            data: component.data,
          } as never);
        }

        // ── Post-stream operations (all non-fatal) ──

        try {
          await saveConversationState(userId, updatedState);
        } catch (err) {
          console.error("[CHAT] Failed to save state:", err);
        }

        try {
          const fullText = await result.text;
          await saveMessage(userId, {
            role: "assistant",
            content: fullText,
            messageType: "text",
            metadata: components.length > 0 ? { components } : {},
            chapter: updatedState.currentChapter,
          });
        } catch (err) {
          console.error("[CHAT] Failed to save assistant msg:", err);
        }

        // Rolling summary every 10 messages
        if (messageCount > 0 && messageCount % 10 === 0) {
          try {
            const recentMsgs = await (
              await import("@/lib/state/messages")
            ).loadRecentMessages(userId, 10);
            const newSummary = await generateRollingSummary(
              summary,
              recentMsgs.map((m) => ({ role: m.role, content: m.content }))
            );
            await saveSummary(userId, newSummary);
            console.log(`[CHAT] Rolling summary updated at msg ${messageCount}`);
          } catch (err) {
            console.error("[CHAT] Rolling summary failed:", err);
          }
        }

        // Commit extracted data to profile
        if (
          !chapterTransitioned &&
          Object.keys(extraction.extractedFields).length > 0
        ) {
          try {
            await commitChapterToProfile(userId, extraction.extractedFields);
          } catch (err) {
            console.error("[CHAT] Profile commit failed:", err);
          }
        }

        // Check onboarding completion
        if (
          updatedState.currentChapter === 4 &&
          isMinimumViableComplete(updatedState) &&
          !isSystemTrigger
        ) {
          const confirmWords = [
            "yes", "right", "correct", "looks good", "that's right",
            "go ahead", "proceed",
          ];
          const userLower = userText.toLowerCase();
          if (confirmWords.some((w) => userLower.includes(w))) {
            try {
              await supabase
                .from("users")
                .update({ onboarding_status: "completed" })
                .eq("id", userId);
              console.log(`[CHAT] Onboarding completed for ${userId.substring(0, 8)}...`);
            } catch (err) {
              console.error("[CHAT] Completion update failed:", err);
            }
          }
        }

        console.log(
          `[CHAT] ${elapsed()} | DONE | Ch${updatedState.currentChapter} | collected: ${Object.entries(updatedState.collected).flatMap(([, items]) => Object.values(items as Record<string, boolean>).filter(Boolean)).length}/${collectedSummaryParts.length + missingSummaryParts.length}`
        );
      } catch (err) {
        // FIX: DO NOT re-throw. The stream text has already been sent to the client.
        // Re-throwing kills the stream mid-response, causing truncated messages + locked chat.
        // Post-stream failures (state save, profile commit, etc.) are non-fatal.
        console.error(`[CHAT] ${elapsed()} | CRITICAL STREAM ERROR (gracefully handled):`, err);
        // Stream closes normally — client receives whatever text was already streamed.
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
