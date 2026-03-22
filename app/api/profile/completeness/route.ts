import { createClient } from "@/lib/supabase/server";
import { loadConversationState } from "@/lib/state/manager";

const SECTION_ITEMS: Record<string, string[]> = {
  personal: [
    "age",
    "city",
    "maritalStatus",
    "dependents",
    "employer",
    "industry",
    "housing",
    "parentSituation",
  ],
  income: ["monthlyTakeHome", "variablePay", "sideIncome"],
  expenses: ["monthlyExpenses", "breakdown"],
  investments: [
    "mutualFunds",
    "stocks",
    "fds",
    "ppf",
    "epf",
    "nps",
    "gold",
    "realEstate",
    "crypto",
    "esopRsu",
  ],
  insurance: ["healthInsurance", "lifeInsurance"],
  tax: ["regime", "deductions"],
  goals: ["goalsOrHurdleRate", "riskProfile", "careerTrajectory"],
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await loadConversationState(user.id);

  const sections = Object.entries(SECTION_ITEMS).map(([name, items]) => {
    const sectionData =
      state.collected[name as keyof typeof state.collected] || {};
    const collected = items.filter(
      (item) => sectionData[item as keyof typeof sectionData] === true
    );
    const missing = items.filter(
      (item) => sectionData[item as keyof typeof sectionData] !== true
    );

    return {
      name,
      items,
      total: items.length,
      collected: collected.length,
      missing,
    };
  });

  const totalItems = sections.reduce((sum, s) => sum + s.total, 0);
  const totalCollected = sections.reduce((sum, s) => sum + s.collected, 0);

  return Response.json({
    sections,
    overallPercent: Math.round((totalCollected / totalItems) * 100),
    minimumViableComplete: state.minimumViableComplete,
    documentsStatus: state.documents,
  });
}
