import type { ConversationState } from "@/lib/types/conversation";
import type { ComponentInjection } from "@/lib/types/messages";
import { isChapterComplete } from "@/lib/state/completeness";

/**
 * Evaluate voice call suggestion triggers.
 * Three moments per SPEC. Each fires at most ONCE (tracked via voiceSuggestionsShown).
 */
export function evaluateVoiceSuggestions(
  state: ConversationState
): ComponentInjection[] {
  const shown = state.voiceSuggestionsShown || [];

  // Don't suggest if a voice call is active
  if (state.activeVoiceSession) return [];

  // Moment 1: Ch2→Ch3 transition — when Ch2 is complete
  if (
    !shown.includes("ch2_ch3") &&
    state.currentChapter === 2 &&
    isChapterComplete(state, 2)
  ) {
    state.voiceSuggestionsShown = [...shown, "ch2_ch3"];
    return [
      {
        type: "voice_suggestion",
        data: {
          message:
            "This next part is less about numbers and more about what you actually want from life. Want to switch to a quick call? About 5 minutes.",
        },
        position: "after_response",
      },
    ];
  }

  // Moment 2: Post-document analysis — after first document parsed
  if (
    !shown.includes("post_document") &&
    state.currentChapter >= 2 &&
    (state.documents.bankStatement === "parsed" ||
      state.documents.mfStatement === "parsed" ||
      state.documents.dematStatement === "parsed")
  ) {
    state.voiceSuggestionsShown = [...shown, "post_document"];
    return [
      {
        type: "voice_suggestion",
        data: {
          message:
            "I've found some interesting things in your documents. Want me to walk you through them on a call?",
        },
        position: "after_response",
      },
    ];
  }

  // Moment 3: Ch4 summary — when minimum viable data is complete
  if (
    !shown.includes("ch4_summary") &&
    state.currentChapter === 4 &&
    state.minimumViableComplete
  ) {
    state.voiceSuggestionsShown = [...shown, "ch4_summary"];
    return [
      {
        type: "voice_suggestion",
        data: {
          message:
            "I've got a clear picture of your finances now. Can I walk you through what I've learned in a quick 3-minute call?",
        },
        position: "after_response",
      },
    ];
  }

  return [];
}
