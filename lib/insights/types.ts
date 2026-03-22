export type InsightType =
  | "asset_allocation"
  | "savings_rate"
  | "equity_debt_split"
  | "insurance_gap"
  | "expense_pattern"
  | "peer_comparison";

export interface InsightResult {
  type: InsightType;
  headline: string;
  keyNumber?: string;
  explanation: string;
  chartType?: "donut" | "bar" | "comparison";
  chartData?: Record<string, number>;
  isDemographic: boolean;
}
