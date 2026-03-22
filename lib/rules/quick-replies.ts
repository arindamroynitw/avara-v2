import type { ConversationState } from "@/lib/types/conversation";
import type { ComponentInjection } from "@/lib/types/messages";
import type { ExtractionResult } from "@/lib/state/merge";

export function evaluateQuickReplies(
  state: ConversationState,
  _extraction: ExtractionResult | null
): ComponentInjection[] {
  const components: ComponentInjection[] = [];

  // Opening quick replies — first session only, before any personal data collected
  if (
    (state.sessionCount || 1) <= 1 &&
    !state.collected.personal.age &&
    !state.collected.personal.employer
  ) {
    components.push({
      type: "quick_reply",
      data: {
        options: [
          "I want to grow my money faster",
          "I have a specific question",
          "A friend recommended Avara",
          "I want someone to check if I'm doing things right",
        ],
      },
      position: "after_response",
    });
  }

  // U4: Returning user quick replies — sessionCount > 1
  if ((state.sessionCount || 1) > 1 && state.collected.personal.age) {
    components.push({
      type: "quick_reply",
      data: {
        options: [
          "Let's pick up where we left off",
          "Remind me what we covered",
          "Start fresh",
        ],
      },
      position: "after_response",
    });
  }

  return components;
}
