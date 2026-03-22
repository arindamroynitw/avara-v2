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
      compute: () => computeAssetAllocationInsight(profile, assets),
    },
    {
      type: "savings_rate",
      compute: () => computeSavingsRateInsight(profile),
    },
    {
      type: "expense_pattern",
      compute: () => computeExpensePatternInsight(profile),
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
