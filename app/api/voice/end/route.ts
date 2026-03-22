import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getConversationDetails } from "@/lib/elevenlabs/client";
import {
  loadConversationState,
  saveConversationState,
} from "@/lib/state/manager";
import { mergeExtraction } from "@/lib/state/merge";
import { commitChapterToProfile } from "@/lib/state/profile-sync";
import { saveMessage } from "@/lib/state/messages";
import {
  buildVoiceExtractionPrompt,
  buildVoiceSummaryPrompt,
} from "@/lib/prompts/voice-system-prompt";

const openai = new OpenAI();

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, conversationId, durationSeconds } = await req.json();

  try {
    // Fetch transcript with retry (ElevenLabs may need time to finalize)
    let transcript: Array<{ role: string; message: string }> = [];
    for (const delay of [500, 2000, 5000]) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        const details = await getConversationDetails(conversationId);
        if (details.transcript.length > 0) {
          transcript = details.transcript;
          break;
        }
      } catch (err) {
        console.warn(`Transcript fetch attempt (${delay}ms) failed:`, err);
      }
    }

    // Build transcript text for processing
    const transcriptText = transcript
      .map((t) => `${t.role === "assistant" ? "Ria" : "User"}: ${t.message}`)
      .join("\n");

    // Run extraction + summary in parallel via GPT-4o
    const [extractionResult, summaryResult] = await Promise.all([
      transcriptText
        ? openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: buildVoiceExtractionPrompt() },
              { role: "user", content: transcriptText },
            ],
            temperature: 0,
            max_tokens: 1000,
          })
        : Promise.resolve(null),
      transcriptText
        ? openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: buildVoiceSummaryPrompt() },
              { role: "user", content: transcriptText },
            ],
            temperature: 0.3,
            max_tokens: 500,
          })
        : Promise.resolve(null),
    ]);

    const extractedData = extractionResult
      ? JSON.parse(extractionResult.choices[0].message.content || "{}")
      : {};

    const summaryData = summaryResult
      ? JSON.parse(summaryResult.choices[0].message.content || "{}")
      : { coveredTopics: [], fullSummary: "Voice call completed." };

    // Update voice session record
    await supabase
      .from("voice_sessions")
      .update({
        conversation_id: conversationId,
        status: "completed",
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        transcript,
        extracted_data: extractedData,
        summary: summaryData.fullSummary,
      })
      .eq("id", sessionId);

    // Merge extracted data into conversation state
    const state = await loadConversationState(user.id);
    const updatedState = mergeExtraction(
      state,
      { extractedFields: extractedData },
      0 // don't increment message count for voice
    );
    updatedState.activeVoiceSession = null;
    updatedState.completedVoiceSessions.push(sessionId);
    await saveConversationState(user.id, updatedState);

    // Commit to profile
    if (Object.keys(extractedData).length > 0) {
      await commitChapterToProfile(user.id, extractedData);
    }

    // Save voice summary as a message in chat
    await saveMessage(user.id, {
      role: "assistant",
      content: summaryData.fullSummary,
      messageType: "voice_summary",
      metadata: {
        durationSeconds,
        coveredTopics: summaryData.coveredTopics,
        voiceSessionId: sessionId,
      },
      chapter: updatedState.currentChapter,
    });

    return Response.json({
      summary: {
        durationSeconds,
        coveredTopics: summaryData.coveredTopics || [],
        fullSummary: summaryData.fullSummary || "Voice call completed.",
      },
    });
  } catch (err) {
    console.error("Voice end error:", err);

    // Mark session as failed
    await supabase
      .from("voice_sessions")
      .update({ status: "failed" })
      .eq("id", sessionId);

    // Clear active session
    const state = await loadConversationState(user.id);
    state.activeVoiceSession = null;
    await saveConversationState(user.id, state);

    return Response.json(
      {
        error: "Failed to process voice session",
        summary: {
          durationSeconds: durationSeconds || 0,
          coveredTopics: [],
          fullSummary: "Voice call ended. I'll continue from where we left off.",
        },
      },
      { status: 500 }
    );
  }
}
