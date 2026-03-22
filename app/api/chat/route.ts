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
import { saveMessage, loadRecentMessages } from "@/lib/state/messages";
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

export async function POST(req: Request) {
  const { messages: uiMessages }: { messages: UIMessage[] } = await req.json();

  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Load state
  const conversationState = await loadConversationState(user.id);
  const summary = await loadSummary(user.id);

  // 3. Get user info
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // 4. Get user's latest message text
  const lastUserMessage = uiMessages[uiMessages.length - 1];
  const userText =
    lastUserMessage?.parts
      ?.filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("") || "";

  // 5. Check for document parsed/failed triggers
  const docParsedMatch = userText.match(
    /^\[DOCUMENT_PARSED:(\w+):(.+)\]$/
  );
  const docFailedMatch = userText.match(/^\[DOCUMENT_FAILED:(\w+)\]$/);

  let documentContext = "";
  if (docParsedMatch) {
    const [, docType, docId] = docParsedMatch;
    // Load parsed data to include in context for Ria
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

  // Voice session ended trigger
  const voiceEndedMatch = userText.match(/^\[VOICE_ENDED:(.+)\]$/);
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

  const isSystemTrigger =
    userText === "[SESSION_START]" ||
    docParsedMatch ||
    docFailedMatch ||
    voiceEndedMatch;

  // Save user message to DB (skip system triggers)
  if (!isSystemTrigger) {
    await saveMessage(user.id, {
      role: "user",
      content: userText,
      messageType: "text",
      chapter: conversationState.currentChapter,
    });
  }

  // 6. Build dynamic system prompt
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

  // Check returning user (lastActiveAt > 24h ago)
  const lastActive = conversationState.lastActiveAt
    ? new Date(conversationState.lastActiveAt)
    : null;
  const isReturningUser =
    lastActive && Date.now() - lastActive.getTime() > 24 * 60 * 60 * 1000;

  // Update lastActiveAt + sessionCount for returning users
  conversationState.lastActiveAt = new Date().toISOString();
  if (isReturningUser && userText === "[SESSION_START]") {
    conversationState.sessionCount = (conversationState.sessionCount || 1) + 1;
  }

  // Check minimum viable data
  const minViableComplete = isMinimumViableComplete(conversationState);
  conversationState.minimumViableComplete = minViableComplete;

  const systemPrompt =
    buildSystemPrompt({
      userName: userData?.full_name || "there",
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

  // 7. Convert messages for model
  const modelMessages = await convertToModelMessages(uiMessages);

  // 8. Fire parallel calls
  const streamPromise = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: modelMessages,
    temperature: 0.7,
    maxOutputTokens: 800,
  });

  const extractionPromise = isSystemTrigger
    ? Promise.resolve({ extractedFields: {} })
    : extractStructuredData(userText, conversationState);

  // 9. Create UI message stream
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // Merge streaming text
      const result = await streamPromise;
      writer.merge(result.toUIMessageStream());

      // Wait for extraction
      const extraction = await extractionPromise;

      // Merge extraction into state
      const messageCount = await incrementMessageCount(user.id);
      const updatedState = mergeExtraction(
        conversationState,
        extraction,
        messageCount
      );

      // Check chapter transitions BEFORE rules evaluation
      let chapterTransitioned = false;
      if (
        isChapterComplete(updatedState, updatedState.currentChapter) &&
        updatedState.currentChapter < 4 &&
        !updatedState.chapterCompletedAt[updatedState.currentChapter]
      ) {
        // Commit chapter data to profile
        await commitChapterToProfile(
          user.id,
          extraction.extractedFields
        );

        updatedState.chapterCompletedAt[updatedState.currentChapter] =
          new Date().toISOString();
        const nextChapter = (updatedState.currentChapter + 1) as
          | 1
          | 2
          | 3
          | 4;
        updatedState.chapterStartedAt[nextChapter] =
          new Date().toISOString();

        // At Ch1→Ch2: Append data safety framing to the streamed response
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
      const [profileRes, assetsRes] = await Promise.all([
        supabase
          .from("financial_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase.from("assets").select("*").eq("user_id", user.id),
      ]);

      // Count real user messages (non-system-trigger messages from the client)
      const realUserMessages = uiMessages.filter(
        (m) =>
          m.role === "user" &&
          !m.parts?.some(
            (p) =>
              p.type === "text" &&
              (p as { type: "text"; text: string }).text.startsWith("[")
          )
      );

      // Evaluate rules engine (with profile context for insights)
      const { components } = evaluateRules(updatedState, extraction, {
        profile: profileRes.data,
        assets: assetsRes.data || [],
        isFirstAssistantMessage: userText === "[SESSION_START]",
        userMessageCount: realUserMessages.length,
      });

      // Write component injections as data parts
      for (const component of components) {
        writer.write({
          type: `data-${component.type}`,
          data: component.data,
        } as never);
      }

      // Save state
      await saveConversationState(user.id, updatedState);

      // Save assistant message
      const fullText = await result.text;
      await saveMessage(user.id, {
        role: "assistant",
        content: fullText,
        messageType: "text",
        metadata: components.length > 0 ? { components } : {},
        chapter: updatedState.currentChapter,
      });

      // Rolling summary every 10 messages
      if (messageCount > 0 && messageCount % 10 === 0) {
        const recentMsgs = await loadRecentMessages(user.id, 10);
        const newSummary = await generateRollingSummary(
          summary,
          recentMsgs.map((m) => ({ role: m.role, content: m.content }))
        );
        await saveSummary(user.id, newSummary);
      }

      // Also commit any extracted data to profile immediately (not just at chapter transitions)
      if (
        !chapterTransitioned &&
        Object.keys(extraction.extractedFields).length > 0
      ) {
        await commitChapterToProfile(user.id, extraction.extractedFields);
      }

      // Check for onboarding completion (Ch4 + minimum viable + user confirmed)
      if (
        updatedState.currentChapter === 4 &&
        isMinimumViableComplete(updatedState) &&
        !isSystemTrigger
      ) {
        // Check if user's message indicates confirmation
        const confirmWords = ["yes", "right", "correct", "looks good", "that's right", "go ahead", "proceed"];
        const userLower = userText.toLowerCase();
        if (confirmWords.some((w) => userLower.includes(w))) {
          // Mark onboarding as completed
          await supabase
            .from("users")
            .update({ onboarding_status: "completed" })
            .eq("id", user.id);
        }
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
