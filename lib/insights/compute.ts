import type { InsightResult } from "./types";
import {
  SAVINGS_RATE_BENCHMARKS,
  EQUITY_ALLOCATION_BENCHMARKS,
  INSURANCE_BENCHMARKS,
  getSavingsRateKey,
  getEquityAllocationKey,
} from "./benchmarks";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Asset Allocation — Donut chart showing equity/debt/gold/RE/cash split.
 * Includes EPF, PPF, NPS, FDs — the TRUE allocation.
 */
export function computeAssetAllocationInsight(
  profile: any,
  assets: any[]
): InsightResult | null {
  if (!assets || assets.length === 0) return null;

  const allocation: Record<string, number> = {};

  for (const asset of assets) {
    const val = Number(asset.current_value) || 0;
    if (val <= 0) continue;

    const type = asset.asset_type;
    const category =
      type === "mutual_fund"
        ? asset.details?.category === "equity"
          ? "Equity"
          : asset.details?.category === "debt"
            ? "Debt"
            : "Hybrid"
        : type === "stock" || type === "esop_rsu"
          ? "Equity"
          : type === "fd" || type === "ppf" || type === "epf" || type === "nps"
            ? "Debt"
            : type === "gold_physical" ||
                type === "gold_digital" ||
                type === "gold_sgb"
              ? "Gold"
              : type === "real_estate"
                ? "Real Estate"
                : type === "crypto"
                  ? "Crypto"
                  : "Other";

    allocation[category] = (allocation[category] || 0) + val;
  }

  if (Object.keys(allocation).length < 1) return null;

  const total = Object.values(allocation).reduce((a, b) => a + b, 0);
  const equityPct = Math.round(((allocation["Equity"] || 0) / total) * 100);

  return {
    type: "asset_allocation",
    headline: "Your True Asset Allocation",
    explanation: `Your portfolio is ${equityPct}% equity — including EPF, PPF, and FDs that most people forget. This is the real picture of how your money is distributed.`,
    chartType: "donut",
    chartData: allocation,
    isDemographic: false,
  };
}

/**
 * Savings Rate — key number + comparison bar.
 */
export function computeSavingsRateInsight(
  profile: any
): InsightResult | null {
  const income = Number(profile.monthly_take_home);
  const expenses = Number(profile.monthly_expenses);
  if (!income || !expenses || income <= 0) return null;

  const savingsRate = Math.round(((income - expenses) / income) * 100);
  const key = getSavingsRateKey(profile.age, profile.industry);
  const benchmark = SAVINGS_RATE_BENCHMARKS[key] || SAVINGS_RATE_BENCHMARKS.default;
  const medianPct = Math.round(benchmark.median * 100);

  const comparison = savingsRate > medianPct ? "above" : savingsRate < medianPct ? "below" : "at";

  return {
    type: "savings_rate",
    headline: "Your Savings Rate",
    keyNumber: `${savingsRate}%`,
    explanation: `You save ${savingsRate}% of your income. That's ${comparison} the median of ${medianPct}% for people in your demographic.`,
    chartType: "comparison",
    chartData: {
      You: savingsRate,
      "Peers (median)": medianPct,
      "Top 25%": Math.round(benchmark.p75 * 100),
    },
    isDemographic: true,
  };
}

/**
 * Insurance Coverage Gap — current vs recommended.
 */
export function computeInsuranceGapInsight(
  profile: any
): InsightResult | null {
  if (!profile.health_insurance_status) return null;

  const healthSum = Number(profile.health_insurance_sum) || 0;
  const hasTermLife = profile.term_life_insurance;
  const termCover = Number(profile.term_life_cover) || 0;
  const annualIncome = (Number(profile.monthly_take_home) || 0) * 12;

  const issues: string[] = [];

  if (healthSum < INSURANCE_BENCHMARKS.healthMinimum) {
    issues.push(
      `health cover of ₹${(healthSum / 100000).toFixed(0)}L is below the ₹10L minimum`
    );
  }

  if (!hasTermLife && annualIncome > 0) {
    issues.push("no term life insurance");
  } else if (
    hasTermLife &&
    termCover > 0 &&
    annualIncome > 0 &&
    termCover < annualIncome * INSURANCE_BENCHMARKS.termLifeMultiplier
  ) {
    issues.push(
      `term cover of ₹${(termCover / 10000000).toFixed(1)}Cr is below the recommended ${INSURANCE_BENCHMARKS.termLifeMultiplier}x income`
    );
  }

  if (issues.length === 0) return null;

  return {
    type: "insurance_gap",
    headline: "Insurance Coverage Check",
    explanation: `A quick look at your coverage: ${issues.join("; ")}. These are common gaps we see — your financial plan will include specific recommendations.`,
    chartType: "comparison",
    chartData: {
      "Your Health Cover": healthSum / 100000,
      "Recommended Min": INSURANCE_BENCHMARKS.healthMinimum / 100000,
    },
    isDemographic: true,
  };
}

/**
 * Expense Pattern — bar chart of spending categories (from bank statement).
 */
export function computeExpensePatternInsight(
  profile: any
): InsightResult | null {
  const breakdown = profile.expense_breakdown;
  if (!breakdown || typeof breakdown !== "object") return null;

  const categories = Object.entries(breakdown)
    .filter(([, v]) => Number(v) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]));

  if (categories.length < 2) return null;

  const chartData: Record<string, number> = {};
  for (const [key, value] of categories) {
    const label = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    chartData[label] = Number(value);
  }

  const topCategory = categories[0][0].replace(/_/g, " ");

  return {
    type: "expense_pattern",
    headline: "Where Your Money Goes",
    explanation: `Your biggest spending category is ${topCategory}. Seeing the actual pattern from your bank statement is usually different from what people estimate.`,
    chartType: "bar",
    chartData,
    isDemographic: false,
  };
}

/**
 * Peer Comparison — side-by-side bars.
 * Uses demographic benchmarks when user data is sparse.
 */
export function computePeerComparison(
  profile: any
): InsightResult | null {
  if (!profile.age || !profile.monthly_take_home) return null;

  const key = getEquityAllocationKey(profile.age);
  const benchmark =
    EQUITY_ALLOCATION_BENCHMARKS[key] ||
    EQUITY_ALLOCATION_BENCHMARKS.default;

  return {
    type: "peer_comparison",
    headline: "How You Compare",
    explanation: `People your age typically have ${Math.round(benchmark.typical * 100)}% in equity, but the recommended minimum is ${Math.round(benchmark.recommendedMin * 100)}%. Your financial plan will optimise this for your specific goals.`,
    chartType: "comparison",
    chartData: {
      "Typical for age": Math.round(benchmark.typical * 100),
      "Recommended min": Math.round(benchmark.recommendedMin * 100),
    },
    isDemographic: true,
  };
}
