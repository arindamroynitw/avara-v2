import type { ConversationState } from "@/lib/types/conversation";
import type { ComponentInjection } from "@/lib/types/messages";
import type { InsightResult } from "@/lib/insights/types";
import {
  computeAssetAllocationInsight,
  computeSavingsRateInsight,
  computeInsuranceGapInsight,
  computeExpensePatternInsight,
  computePeerComparison,
} from "@/lib/insights/compute";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface InsightContext {
  profile: any;
  assets: any[];
}

/**
 * Evaluate which insights should be delivered right now.
 * Returns max 1 insight per response to avoid overwhelming the user.
 */
export function evaluateInsights(
  state: ConversationState,
  context: InsightContext | null
): ComponentInjection[] {
  if (!context?.profile || !context?.assets) return [];

  const { profile, assets } = context;
  const delivered = state.insightsDelivered || [];

  // Ordered list of insights to try (priority order)
  const candidates: Array<{
    type: string;
    compute: () => InsightResult | null;
  }> = [
    {
      type: "asset_allocation",
      // Only show when we have actual asset records (from conversation OR documents)
      compute: () =>
        assets.length >= 2
          ? computeAssetAllocationInsight(profile, assets)
          : null,
    },
    {
      type: "savings_rate",
      // Only show when both income AND expenses are explicitly collected
      compute: () =>
        state.collected?.income?.monthlyTakeHome &&
        state.collected?.expenses?.monthlyExpenses
          ? computeSavingsRateInsight(profile)
          : null,
    },
    {
      type: "expense_pattern",
      // FIX: Only show expense breakdown when bank statement is actually parsed.
      // Without this guard, conversational mentions of spending ("20k rent, 10k food")
      // trigger the insight prematurely with incomplete data.
      compute: () =>
        state.documents?.bankStatement === "parsed"
          ? computeExpensePatternInsight(profile)
          : null,
    },
    {
      type: "insurance_gap",
      compute: () => computeInsuranceGapInsight(profile),
    },
    {
      type: "peer_comparison",
      compute: () => computePeerComparison(profile),
    },
  ];

  for (const candidate of candidates) {
    // Skip already delivered
    if (delivered.includes(candidate.type)) continue;

    const result = candidate.compute();
    if (result) {
      // Mark as delivered (caller must persist this)
      state.insightsDelivered.push(result.type);

      return [
        {
          type: "insight_card",
          data: {
            headline: result.headline,
            keyNumber: result.keyNumber,
            explanation: result.explanation,
            chartType: result.chartType,
            chartData: result.chartData,
            isDemographic: result.isDemographic,
          },
          position: "after_response",
        },
      ];
    }
  }

  return [];
}
