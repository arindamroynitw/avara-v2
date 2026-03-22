export type AssetType =
  | "mutual_fund"
  | "stock"
  | "fd"
  | "ppf"
  | "epf"
  | "nps"
  | "gold_physical"
  | "gold_digital"
  | "gold_sgb"
  | "real_estate"
  | "crypto"
  | "esop_rsu"
  | "other";

export type DebtType =
  | "home_loan"
  | "education_loan"
  | "car_loan"
  | "personal_loan"
  | "credit_card"
  | "bnpl"
  | "family"
  | "other";

export type HousingStatus = "renting" | "owning" | "family";

export type HealthInsuranceStatus =
  | "personal"
  | "employer_only"
  | "both"
  | "none";

export type TaxRegime = "old" | "new";

export type RiskLevel = "conservative" | "moderate" | "aggressive";

export type CapacityLevel = "low" | "medium" | "high";

export interface FinancialProfile {
  id: string;
  userId: string;

  // Personal
  age?: number;
  city?: string;
  maritalStatus?: string;
  dependents: number;
  employer?: string;
  industry?: string;
  role?: string;
  tenureYears?: number;
  housing?: HousingStatus;
  parentFinanciallyIndependent?: boolean;
  parentHealthInsurance?: boolean;

  // Income
  monthlyTakeHome?: number;
  variablePayAnnual?: number;
  sideIncomeMonthly?: number;
  incomeStability?: "stable" | "variable" | "uncertain";

  // Expenses
  monthlyExpenses?: number;
  expenseBreakdown: Record<string, number>;
  savingsRate?: number;

  // Insurance
  healthInsuranceStatus?: HealthInsuranceStatus;
  healthInsuranceSum?: number;
  termLifeInsurance?: boolean;
  termLifeCover?: number;
  hasEndowmentUlip?: boolean;
  endowmentUlipDetails: Array<Record<string, unknown>>;

  // Tax
  taxRegime?: TaxRegime;
  deductionsClaimed: Record<string, number>;

  // Goals & Risk
  goals: Array<{
    type: string;
    description: string;
    amount?: number;
    timeline?: string;
    firmness?: "firm" | "flexible" | "aspirational";
  }>;
  hurdleRate?: number;
  riskWillingness?: RiskLevel;
  riskCapacity?: CapacityLevel;
  pastPanicSold?: boolean;
  careerTrajectory?: string;
  lifeIn3Years?: string;

  // Computed
  trueAssetAllocation: Record<string, number>;
  totalNetWorth?: number;

  // Completeness tracking
  completeness: Record<string, string[]>;

  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  userId: string;
  assetType: AssetType;
  name?: string;
  currentValue?: number;
  investedValue?: number;
  details: Record<string, unknown>;
  source: "conversation" | "document" | "mfapi";
  sourceDocumentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  debtType: DebtType;
  outstanding?: number;
  emi?: number;
  interestRate?: number;
  tenureRemainingMonths?: number;
  lender?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SectionCompleteness {
  section: string;
  items: string[];
  collected: string[];
  notApplicable: string[];
}
