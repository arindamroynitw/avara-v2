export type DocumentType =
  | "bank_statement"
  | "mf_statement"
  | "demat_statement"
  | "salary_slip"
  | "form_16"
  | "itr"
  | "insurance_policy"
  | "loan_statement"
  | "esop_grant"
  | "nps_statement"
  | "epf_passbook"
  | "other";

export type DocumentStatus = "uploaded" | "processing" | "parsed" | "failed";

export interface UploadedDocument {
  id: string;
  userId: string;
  documentType: DocumentType;
  fileName: string;
  storagePath: string;
  fileSize: number;
  status: DocumentStatus;
  parsedData: Record<string, unknown>;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankStatementParsed {
  account_holder: string;
  bank: string;
  period: { from: string; to: string };
  salary_credits: Array<{
    date: string;
    amount: number;
    description: string;
  }>;
  emi_debits: Array<{ date: string; amount: number; description: string }>;
  sip_debits: Array<{ date: string; amount: number; fund_name: string }>;
  insurance_premiums: Array<{
    date: string;
    amount: number;
    provider: string;
  }>;
  expense_categories: {
    food_delivery: number;
    shopping: number;
    subscriptions: number;
    rent: number;
    utilities: number;
    transfers: number;
    other: number;
  };
  average_monthly_income: number;
  average_monthly_expenses: number;
}

export interface MFStatementParsed {
  funds: Array<{
    fund_name: string;
    folio_number: string;
    plan: "direct" | "regular";
    current_value: number;
    invested_value: number;
    units: number;
    nav: number;
    sip_amount: number | null;
    category: "equity" | "debt" | "hybrid" | "other";
  }>;
  total_current_value: number;
  total_invested_value: number;
}

export interface DematStatementParsed {
  holdings: Array<{
    stock_name: string;
    isin: string;
    quantity: number;
    average_price: number;
    current_value: number;
  }>;
  total_value: number;
}
