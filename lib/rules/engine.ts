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

/**
 * Generate a stable ID for a component injection to track deduplication.
 */
function getComponentId(c: ComponentInjection): string {
  // Use type + a key from the data to create a stable ID
  const data = c.data as Record<string, unknown>;
  if (c.type === "upload_card") return `upload_card:${data.documentType}`;
  if (c.type === "insight_card") return `insight_card:${data.headline || "unknown"}`;
  if (c.type === "voice_suggestion") return `voice_suggestion`;
  if (c.type === "progress_nudge") return `progress_nudge:ch${data.currentChapter}`;
  // Quick replies and others don't need deduplication (they have their own guards)
  return `${c.type}:${JSON.stringify(data).substring(0, 30)}`;
}

export function evaluateRules(
  state: ConversationState,
  extraction: ExtractionResult | null,
  context?: RuleContext
): RuleResult {
  const allComponents: ComponentInjection[] = [];

  allComponents.push(
    ...evaluateQuickReplies(state, extraction, {
      isFirstAssistantMessage: context?.isFirstAssistantMessage,
      userMessageCount: context?.userMessageCount,
    })
  );
  allComponents.push(...evaluateUploadCards(state));
  allComponents.push(...evaluateChapterTransitions(state));

  // Insight evaluation (needs profile + assets context)
  if (context?.profile) {
    allComponents.push(
      ...evaluateInsights(state, {
        profile: context.profile,
        assets: context.assets || [],
      })
    );
  }

  // Voice call suggestions
  allComponents.push(...evaluateVoiceSuggestions(state));

  // Centralized deduplication: skip components already shown to this user
  const shown = state.componentsShown || [];
  const newComponents = allComponents.filter((c) => {
    const id = getComponentId(c);
    // Quick replies bypass dedup (they have their own isFirstAssistantMessage guard)
    if (c.type === "quick_reply") return true;
    if (shown.includes(id)) return false;
    // Mark as shown (will be persisted when state is saved)
    state.componentsShown = [...(state.componentsShown || []), id];
    return true;
  });

  // Limit to max 2 components per response to avoid flooding
  return { components: newComponents.slice(0, 2) };
}
