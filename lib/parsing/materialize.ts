import { createClient } from "@/lib/supabase/server";
import type {
  BankStatementParsed,
  MFStatementParsed,
  DematStatementParsed,
} from "@/lib/types/documents";
import type { ConversationState } from "@/lib/types/conversation";

/**
 * Materialize bank statement data:
 * - Update financial_profiles with income/expense data
 * - Create debts rows for any EMIs found
 * - Update conversation state document status + collected flags
 */
export async function materializeBankStatement(
  userId: string,
  docId: string,
  parsed: BankStatementParsed,
  state: ConversationState
): Promise<ConversationState> {
  const supabase = await createClient();

  // Update financial_profiles with income + expense data
  const profileUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.average_monthly_income > 0) {
    profileUpdates.monthly_take_home = parsed.average_monthly_income;
  }
  if (parsed.average_monthly_expenses > 0) {
    profileUpdates.monthly_expenses = parsed.average_monthly_expenses;
  }
  if (parsed.expense_categories) {
    profileUpdates.expense_breakdown = parsed.expense_categories;
  }
  if (
    parsed.average_monthly_income > 0 &&
    parsed.average_monthly_expenses > 0
  ) {
    profileUpdates.savings_rate =
      (parsed.average_monthly_income - parsed.average_monthly_expenses) /
      parsed.average_monthly_income;
  }

  if (Object.keys(profileUpdates).length > 1) {
    await supabase
      .from("financial_profiles")
      .update(profileUpdates)
      .eq("user_id", userId);
  }

  // Create debts for EMIs found
  if (parsed.emi_debits && parsed.emi_debits.length > 0) {
    // Group EMIs by description to avoid duplicates
    const uniqueEmis = new Map<string, number>();
    for (const emi of parsed.emi_debits) {
      const key = emi.description.toLowerCase().trim();
      if (!uniqueEmis.has(key) || emi.amount > (uniqueEmis.get(key) || 0)) {
        uniqueEmis.set(key, emi.amount);
      }
    }

    for (const [desc, amount] of uniqueEmis) {
      const debtType = desc.includes("home")
        ? "home_loan"
        : desc.includes("car") || desc.includes("auto")
          ? "car_loan"
          : desc.includes("education")
            ? "education_loan"
            : "personal_loan";

      await supabase.from("debts").insert({
        user_id: userId,
        debt_type: debtType,
        emi: amount,
        lender: desc,
      });
    }
  }

  // Update state
  state.documents.bankStatement = "parsed";
  if (parsed.average_monthly_income > 0) {
    state.collected.income.monthlyTakeHome = true;
  }
  if (parsed.average_monthly_expenses > 0) {
    state.collected.expenses.monthlyExpenses = true;
  }
  if (parsed.expense_categories) {
    state.collected.expenses.breakdown = true;
  }

  return state;
}

/**
 * Materialize MF statement data:
 * - Create assets rows for each fund
 * - Update conversation state
 */
export async function materializeMFStatement(
  userId: string,
  docId: string,
  parsed: MFStatementParsed,
  state: ConversationState
): Promise<ConversationState> {
  const supabase = await createClient();

  // Create assets for each fund
  if (parsed.funds && parsed.funds.length > 0) {
    const assetRows = parsed.funds.map((fund) => ({
      user_id: userId,
      asset_type: "mutual_fund" as const,
      name: fund.fund_name,
      current_value: fund.current_value,
      invested_value: fund.invested_value,
      details: {
        folio_number: fund.folio_number,
        plan: fund.plan,
        units: fund.units,
        nav: fund.nav,
        sip_amount: fund.sip_amount,
        category: fund.category,
      },
      source: "document" as const,
      source_document_id: docId,
    }));

    await supabase.from("assets").insert(assetRows);
  }

  // Update state
  state.documents.mfStatement = "parsed";
  state.collected.investments.mutualFunds = true;

  return state;
}

/**
 * Materialize demat statement data:
 * - Create assets rows for each stock holding
 * - Update conversation state
 */
export async function materializeDematStatement(
  userId: string,
  docId: string,
  parsed: DematStatementParsed,
  state: ConversationState
): Promise<ConversationState> {
  const supabase = await createClient();

  // Create assets for each holding
  if (parsed.holdings && parsed.holdings.length > 0) {
    const assetRows = parsed.holdings.map((holding) => ({
      user_id: userId,
      asset_type: "stock" as const,
      name: holding.stock_name,
      current_value: holding.current_value,
      invested_value: holding.average_price * holding.quantity,
      details: {
        isin: holding.isin,
        quantity: holding.quantity,
        average_price: holding.average_price,
      },
      source: "document" as const,
      source_document_id: docId,
    }));

    await supabase.from("assets").insert(assetRows);
  }

  // Update state
  state.documents.dematStatement = "parsed";
  state.collected.investments.stocks = true;

  return state;
}

/**
 * Generate a human-readable summary of parsed document for Ria's response.
 */
export function generateParsedSummary(
  documentType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsedData: any
): string {
  switch (documentType) {
    case "bank_statement": {
      const d = parsedData as BankStatementParsed;
      const parts: string[] = [];
      if (d.average_monthly_income)
        parts.push(
          `monthly income of approximately ₹${formatAmount(d.average_monthly_income)}`
        );
      if (d.average_monthly_expenses)
        parts.push(
          `monthly expenses around ₹${formatAmount(d.average_monthly_expenses)}`
        );
      if (d.emi_debits?.length)
        parts.push(`${d.emi_debits.length} EMI payment(s)`);
      if (d.sip_debits?.length)
        parts.push(`${d.sip_debits.length} SIP debit(s)`);
      return parts.length > 0
        ? `From the bank statement, I can see: ${parts.join(", ")}.`
        : "I've processed the bank statement.";
    }
    case "mf_statement": {
      const d = parsedData as MFStatementParsed;
      return `I can see ${d.funds?.length || 0} mutual fund(s) with a total current value of ₹${formatAmount(d.total_current_value || 0)} (invested: ₹${formatAmount(d.total_invested_value || 0)}).`;
    }
    case "demat_statement": {
      const d = parsedData as DematStatementParsed;
      return `I found ${d.holdings?.length || 0} stock holding(s) with a total value of ₹${formatAmount(d.total_value || 0)}.`;
    }
    default:
      return "I've processed the document.";
  }
}

function formatAmount(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toFixed(0);
}
