import type { ConversationState } from "@/lib/types/conversation";
import type { ComponentInjection } from "@/lib/types/messages";
import type { ExtractionResult } from "@/lib/state/merge";
import { evaluateQuickReplies } from "./quick-replies";
import { evaluateUploadCards } from "./upload-cards";
import { evaluateChapterTransitions } from "./chapter-transitions";
import { evaluateInsights } from "./insights";
import { evaluateVoiceSuggestions } from "./voice-suggestions";

export interface RuleResult {
  components: ComponentInjection[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RuleContext {
  profile?: any;
  assets?: any[];
  isFirstAssistantMessage?: boolean;
  userMessageCount?: number;
}

export function evaluateRules(
  state: ConversationState,
  extraction: ExtractionResult | null,
  context?: RuleContext
): RuleResult {
  const components: ComponentInjection[] = [];

  components.push(
    ...evaluateQuickReplies(state, extraction, {
      isFirstAssistantMessage: context?.isFirstAssistantMessage,
      userMessageCount: context?.userMessageCount,
    })
  );
  components.push(...evaluateUploadCards(state));
  components.push(...evaluateChapterTransitions(state));

  // Insight evaluation (needs profile + assets context)
  if (context?.profile) {
    components.push(
      ...evaluateInsights(state, {
        profile: context.profile,
        assets: context.assets || [],
      })
    );
  }

  // Voice call suggestions
  components.push(...evaluateVoiceSuggestions(state));

  return { components };
}
