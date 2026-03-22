import type { ConversationState } from "@/lib/types/conversation";

export interface SectionProgress {
  name: string;
  total: number;
  collected: number;
}

export function calculateCompleteness(
  state: ConversationState
): SectionProgress[] {
  const sections: SectionProgress[] = [];

  for (const [sectionName, items] of Object.entries(state.collected)) {
    const values = Object.values(items as Record<string, boolean>);
    sections.push({
      name: sectionName,
      total: values.length,
      collected: values.filter(Boolean).length,
    });
  }

  return sections;
}

export function isChapterComplete(
  state: ConversationState,
  chapter: number
): boolean {
  const c = state.collected;

  switch (chapter) {
    case 1:
      return Object.values(c.personal).every(Boolean);

    case 2: {
      const incomeComplete = Object.values(c.income).every(Boolean);
      const expensesComplete = Object.values(c.expenses).every(Boolean);
      // For investments, at least one type must be addressed (all must be true/false via conversation)
      const investmentsComplete = Object.values(c.investments).every(Boolean);
      const insuranceComplete = Object.values(c.insurance).every(Boolean);
      const taxComplete = Object.values(c.tax).every(Boolean);
      return (
        incomeComplete &&
        expensesComplete &&
        investmentsComplete &&
        insuranceComplete &&
        taxComplete
      );
    }

    case 3:
      return Object.values(c.goals).every(Boolean);

    case 4:
      return true; // Summary chapter, always "complete"

    default:
      return false;
  }
}

export function isMinimumViableComplete(state: ConversationState): boolean {
  const c = state.collected;

  // Per PRD hard minimum:
  // - Personal basics (age, city)
  // - Income
  // - At least rough expenses
  // - At least one investment category
  // - Health insurance status
  // - At least one goal or hurdle rate
  const hasPersonalBasics = c.personal.age && c.personal.city;
  const hasIncome = c.income.monthlyTakeHome;
  const hasExpenses = c.expenses.monthlyExpenses;
  const hasAtLeastOneInvestment = Object.values(c.investments).some(Boolean);
  const hasHealthInsurance = c.insurance.healthInsurance;
  const hasLifeInsurance = c.insurance.lifeInsurance;
  const hasGoalsOrHurdle = c.goals.goalsOrHurdleRate;

  return (
    hasPersonalBasics &&
    hasIncome &&
    hasExpenses &&
    hasAtLeastOneInvestment &&
    hasHealthInsurance &&
    hasLifeInsurance &&
    hasGoalsOrHurdle
  );
}

/**
 * Returns a human-readable list of what's still missing for minimum viable data.
 */
export function getMinimumViableMissing(state: ConversationState): string[] {
  const c = state.collected;
  const missing: string[] = [];

  if (!c.personal.age || !c.personal.city) missing.push("age and city");
  if (!c.income.monthlyTakeHome) missing.push("monthly take-home income");
  if (!c.expenses.monthlyExpenses) missing.push("monthly expenses (even an estimate)");
  if (!Object.values(c.investments).some(Boolean))
    missing.push("at least one investment type");
  if (!c.insurance.healthInsurance) missing.push("health insurance status");
  if (!c.insurance.lifeInsurance) missing.push("life insurance status");
  if (!c.goals.goalsOrHurdleRate) missing.push("a goal or target return rate");

  return missing;
}
