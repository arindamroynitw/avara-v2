import { createClient } from "@/lib/supabase/server";
import { loadConversationState } from "@/lib/state/manager";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load profile, assets, debts, documents, state in parallel
  const [profileRes, assetsRes, debtsRes, docsRes, state] = await Promise.all([
    supabase
      .from("financial_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("debts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("uploaded_documents")
      .select("id, document_type, file_name, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    loadConversationState(user.id),
  ]);

  return Response.json({
    profile: profileRes.data || {},
    assets: assetsRes.data || [],
    debts: debtsRes.data || [],
    documents: docsRes.data || [],
    collected: state.collected,
    currentChapter: state.currentChapter,
    minimumViableComplete: state.minimumViableComplete,
    documentsStatus: state.documents,
  });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = await req.json();

  // Map camelCase keys to snake_case for DB
  const FIELD_MAP: Record<string, string> = {
    age: "age",
    city: "city",
    maritalStatus: "marital_status",
    dependents: "dependents",
    employer: "employer",
    industry: "industry",
    role: "role",
    housing: "housing",
    monthlyTakeHome: "monthly_take_home",
    variablePayAnnual: "variable_pay_annual",
    sideIncomeMonthly: "side_income_monthly",
    monthlyExpenses: "monthly_expenses",
    healthInsuranceStatus: "health_insurance_status",
    healthInsuranceSum: "health_insurance_sum",
    termLifeInsurance: "term_life_insurance",
    termLifeCover: "term_life_cover",
    taxRegime: "tax_regime",
    riskWillingness: "risk_willingness",
    careerTrajectory: "career_trajectory",
  };

  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const [key, value] of Object.entries(updates)) {
    const col = FIELD_MAP[key] || key;
    dbUpdates[col] = value;
  }

  const { error } = await supabase
    .from("financial_profiles")
    .update(dbUpdates)
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: "Update failed" }, { status: 500 });
  }

  return Response.json({ success: true });
}
