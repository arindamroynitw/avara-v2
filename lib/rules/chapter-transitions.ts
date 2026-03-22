import type { ConversationState } from "@/lib/types/conversation";
import type { ComponentInjection } from "@/lib/types/messages";
import {
  isChapterComplete,
  calculateCompleteness,
} from "@/lib/state/completeness";

export function evaluateChapterTransitions(
  state: ConversationState
): ComponentInjection[] {
  const components: ComponentInjection[] = [];

  // Check if current chapter is complete and we should transition
  if (
    isChapterComplete(state, state.currentChapter) &&
    state.currentChapter < 4 &&
    !state.chapterCompletedAt[state.currentChapter]
  ) {
    // Progress nudge at chapter completion
    const sections = calculateCompleteness(state);
    components.push({
      type: "progress_nudge",
      data: {
        sections: sections.map((s) => ({
          name: s.name,
          total: s.total,
          collected: s.collected,
        })),
        currentChapter: state.currentChapter,
      },
      position: "after_response",
    });
  }

  return components;
}

// The data safety framing text for Ch1→Ch2 transition
export const DATA_SAFETY_FRAMING = `Before we get into the money side — everything you share with me is completely confidential. As a SEBI-registered advisor, we're legally bound by client confidentiality norms — your data can't be shared with anyone, ever. Your documents are encrypted, only used to build your financial plan, and you can ask us to delete everything at any time.`;
