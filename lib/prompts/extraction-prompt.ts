import type { ConversationState } from "@/lib/types/conversation";

export function buildExtractionPrompt(state: ConversationState): string {
  const alreadyCollected = Object.entries(state.collected)
    .flatMap(([section, items]) =>
      Object.entries(items as Record<string, boolean>)
        .filter(([, v]) => v)
        .map(([key]) => `${section}.${key}`)
    )
    .join(", ");

  return `You are a data extraction assistant for a financial advisory conversation. Given a user message, extract any structured data points mentioned.

RULES:
- Return a JSON object with ONLY the fields that have NEW information in this message.
- Do NOT infer or assume — only extract explicitly stated data.
- Use null for values that are mentioned but ambiguous.
- Return {} (empty object) if no extractable data is found.
- Do not re-extract data that has already been collected.

Already collected: ${alreadyCollected || "nothing yet"}

EXTRACTABLE FIELDS:

Personal:
- "age": number — user's age in years
- "city": string — city they live in
- "maritalStatus": string — "single", "married", "divorced", "widowed"
- "dependents": number — number of financial dependents
- "employer": string — company/organization name
- "industry": string — industry sector (tech, finance, healthcare, etc.)
- "role": string — job title or role description
- "housing": string — "renting", "owning", or "family" (living with parents)
- "parentFinanciallyIndependent": boolean — are parents financially independent
- "parentHealthInsurance": boolean — do parents have health insurance

Income:
- "monthlyTakeHome": number — monthly take-home salary in rupees (NOT CTC)
- "variablePay": number — annual variable pay / bonus in rupees
- "sideIncome": number — monthly side income in rupees

Expenses:
- "monthlyExpenses": number — total monthly expenses in rupees
- "expenseBreakdown": object — { rent, food, transport, subscriptions, utilities, other } in rupees

Investments (set to the described value or details, or true/false for "I have/don't have"):
- "mutualFunds": any — MF details (value, fund names, SIP amounts) or true/false
- "stocks": any — stock portfolio details or true/false
- "fds": any — FD details or true/false
- "ppf": any — PPF details or true/false
- "epf": any — EPF details or true/false
- "nps": any — NPS details or true/false
- "gold": any — gold holdings details or true/false
- "realEstate": any — real estate details or true/false
- "crypto": any — crypto holdings details or true/false
- "esopRsu": any — ESOP/RSU details or true/false

Insurance:
- "healthInsuranceStatus": string — "personal", "employer_only", "both", "none"
- "healthInsuranceSum": number — health insurance cover amount
- "termLifeInsurance": boolean — has term life insurance
- "termLifeCover": number — term life cover amount

Tax:
- "taxRegime": string — "old" or "new"
- "deductions": object — { "80C": amount, "80D": amount, "HRA": amount, etc. }

Goals & Risk:
- "goals": array — [{ type, description, amount, timeline }]
- "hurdleRate": number — target return percentage if no concrete goals
- "riskWillingness": string — "conservative", "moderate", "aggressive"
- "pastPanicSold": boolean — has user panic-sold investments before
- "careerTrajectory": string — career plans and trajectory
- "lifeIn3Years": string — where they see their life in 3 years

SOPHISTICATION SIGNALS (always include this section):
- "sophisticationSignals": {
    "financialTermsUsed": string[] — any financial terms the user used (CAGR, expense ratio, alpha, etc.)
    "productKnowledge": string — brief note on product knowledge level shown
    "suggestedTierAdjustment": -1 | 0 | 1 — should we adjust sophistication tier?
  }

Return valid JSON only. No explanations.`;
}
