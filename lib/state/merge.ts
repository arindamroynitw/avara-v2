import type { ConversationState } from "@/lib/types/conversation";
import { isMinimumViableComplete } from "./completeness";

export interface ExtractionResult {
  extractedFields: Record<string, unknown>;
  sophisticationSignals?: {
    financialTermsUsed?: string[];
    productKnowledge?: string;
    suggestedTierAdjustment?: -1 | 0 | 1;
  };
}

// Maps extraction field names to collected boolean paths
const FIELD_TO_COLLECTED: Record<string, [string, string]> = {
  age: ["personal", "age"],
  city: ["personal", "city"],
  maritalStatus: ["personal", "maritalStatus"],
  dependents: ["personal", "dependents"],
  employer: ["personal", "employer"],
  industry: ["personal", "industry"],
  role: ["personal", "employer"], // role also counts toward employer being discussed
  housing: ["personal", "housing"],
  parentSituation: ["personal", "parentSituation"],
  parentFinanciallyIndependent: ["personal", "parentSituation"],
  parentHealthInsurance: ["personal", "parentSituation"],
  monthlyTakeHome: ["income", "monthlyTakeHome"],
  variablePay: ["income", "variablePay"],
  sideIncome: ["income", "sideIncome"],
  monthlyExpenses: ["expenses", "monthlyExpenses"],
  expenseBreakdown: ["expenses", "breakdown"],
  mutualFunds: ["investments", "mutualFunds"],
  stocks: ["investments", "stocks"],
  fds: ["investments", "fds"],
  ppf: ["investments", "ppf"],
  epf: ["investments", "epf"],
  nps: ["investments", "nps"],
  gold: ["investments", "gold"],
  realEstate: ["investments", "realEstate"],
  crypto: ["investments", "crypto"],
  esopRsu: ["investments", "esopRsu"],
  healthInsurance: ["insurance", "healthInsurance"],
  healthInsuranceStatus: ["insurance", "healthInsurance"],
  lifeInsurance: ["insurance", "lifeInsurance"],
  termLifeInsurance: ["insurance", "lifeInsurance"],
  taxRegime: ["tax", "regime"],
  deductions: ["tax", "deductions"],
  goals: ["goals", "goalsOrHurdleRate"],
  hurdleRate: ["goals", "goalsOrHurdleRate"],
  riskProfile: ["goals", "riskProfile"],
  riskWillingness: ["goals", "riskProfile"],
  pastPanicSold: ["goals", "riskProfile"],
  careerTrajectory: ["goals", "careerTrajectory"],
  lifeIn3Years: ["goals", "careerTrajectory"],
};

export function mergeExtraction(
  state: ConversationState,
  extraction: ExtractionResult,
  messageCount: number
): ConversationState {
  const updated = structuredClone(state);

  // Merge extracted fields into collected flags
  for (const [field, value] of Object.entries(extraction.extractedFields)) {
    if (value === null || value === undefined) continue;

    const mapping = FIELD_TO_COLLECTED[field];
    if (mapping) {
      const [section, key] = mapping;
      const sectionObj = updated.collected[
        section as keyof typeof updated.collected
      ] as Record<string, boolean>;
      if (sectionObj && key in sectionObj) {
        sectionObj[key] = true;
      }
    }
  }

  // Apply sophistication tier adjustment
  if (extraction.sophisticationSignals?.suggestedTierAdjustment) {
    const adj = extraction.sophisticationSignals.suggestedTierAdjustment;
    // Only adjust every 5 messages to avoid whiplash
    if (messageCount > 0 && messageCount % 5 === 0) {
      const newTier = Math.max(1, Math.min(4, updated.sophisticationTier + adj));
      updated.sophisticationTier = newTier as 1 | 2 | 3 | 4;
    }
  }

  // Update minimum viable check
  updated.minimumViableComplete = isMinimumViableComplete(updated);

  // Update session tracking
  updated.lastActiveAt = new Date().toISOString();

  return updated;
}
