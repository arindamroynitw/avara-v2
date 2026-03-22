/**
 * Hardcoded demographic benchmarks for Indian professionals.
 * Used for "Based on people like you" insights.
 */

export const SAVINGS_RATE_BENCHMARKS: Record<
  string,
  { median: number; p25: number; p75: number }
> = {
  "25-30_tech": { median: 0.35, p25: 0.2, p75: 0.45 },
  "25-30_finance": { median: 0.38, p25: 0.22, p75: 0.48 },
  "25-30_other": { median: 0.3, p25: 0.15, p75: 0.4 },
  "30-35_tech": { median: 0.33, p25: 0.18, p75: 0.42 },
  "30-35_other": { median: 0.28, p25: 0.15, p75: 0.38 },
  default: { median: 0.3, p25: 0.15, p75: 0.4 },
};

export const EQUITY_ALLOCATION_BENCHMARKS: Record<
  string,
  { recommendedMin: number; typical: number }
> = {
  "20-25": { recommendedMin: 0.7, typical: 0.25 },
  "25-30": { recommendedMin: 0.65, typical: 0.3 },
  "30-35": { recommendedMin: 0.6, typical: 0.35 },
  "35-40": { recommendedMin: 0.55, typical: 0.38 },
  default: { recommendedMin: 0.6, typical: 0.3 },
};

export const INSURANCE_BENCHMARKS = {
  healthMinimum: 1000000, // ₹10L minimum
  termLifeMultiplier: 10, // 10x annual income
};

export const EMERGENCY_FUND_MONTHS = 6;

/**
 * Get the savings rate benchmark key based on age and industry.
 */
export function getSavingsRateKey(
  age?: number,
  industry?: string
): string {
  if (!age) return "default";
  const bracket = age < 30 ? "25-30" : "30-35";
  const sector =
    industry?.toLowerCase().includes("tech") ||
    industry?.toLowerCase().includes("software") ||
    industry?.toLowerCase().includes("it")
      ? "tech"
      : industry?.toLowerCase().includes("financ") ||
          industry?.toLowerCase().includes("bank")
        ? "finance"
        : "other";
  return `${bracket}_${sector}`;
}

/**
 * Get equity allocation benchmark key based on age.
 */
export function getEquityAllocationKey(age?: number): string {
  if (!age) return "default";
  if (age < 25) return "20-25";
  if (age < 30) return "25-30";
  if (age < 35) return "30-35";
  if (age < 40) return "35-40";
  return "default";
}
