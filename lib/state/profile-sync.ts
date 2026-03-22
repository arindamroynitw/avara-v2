import { createClient } from "@/lib/supabase/server";

// Maps camelCase extraction fields to snake_case DB columns
const FIELD_TO_COLUMN: Record<string, string> = {
  age: "age",
  city: "city",
  maritalStatus: "marital_status",
  dependents: "dependents",
  employer: "employer",
  industry: "industry",
  role: "role",
  housing: "housing",
  parentFinanciallyIndependent: "parent_financially_independent",
  parentHealthInsurance: "parent_health_insurance",
  monthlyTakeHome: "monthly_take_home",
  variablePay: "variable_pay_annual",
  sideIncome: "side_income_monthly",
  monthlyExpenses: "monthly_expenses",
  expenseBreakdown: "expense_breakdown",
  healthInsuranceStatus: "health_insurance_status",
  healthInsuranceSum: "health_insurance_sum",
  termLifeInsurance: "term_life_insurance",
  termLifeCover: "term_life_cover",
  hasEndowmentUlip: "has_endowment_ulip",
  taxRegime: "tax_regime",
  deductions: "deductions_claimed",
  goals: "goals",
  hurdleRate: "hurdle_rate",
  riskWillingness: "risk_willingness",
  riskCapacity: "risk_capacity",
  pastPanicSold: "past_panic_sold",
  careerTrajectory: "career_trajectory",
  lifeIn3Years: "life_3_years",
};

export async function commitChapterToProfile(
  userId: string,
  chapterData: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const [field, value] of Object.entries(chapterData)) {
    const column = FIELD_TO_COLUMN[field];
    if (column && value !== null && value !== undefined) {
      updates[column] = value;
    }
  }

  if (Object.keys(updates).length > 1) {
    const { error } = await supabase
      .from("financial_profiles")
      .update(updates)
      .eq("user_id", userId);

    if (error) {
      console.error("Profile sync failed:", error.message, { userId, updates });
    }
  }
}
