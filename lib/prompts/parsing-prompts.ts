/**
 * Document parsing prompts for GPT-4o vision.
 * Each prompt specifies the exact JSON schema expected in the response.
 */

export function buildBankStatementPrompt(): string {
  return `You are a financial document parser specializing in Indian bank statements.

Analyze the bank statement images and extract ALL the following data into a JSON object.
Focus on: SBI, HDFC, ICICI, Kotak, Axis bank statement formats.

Return EXACTLY this JSON structure:
{
  "account_holder": "string - name on the account",
  "bank": "string - bank name",
  "period": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
  "salary_credits": [{ "date": "YYYY-MM-DD", "amount": number, "description": "string" }],
  "emi_debits": [{ "date": "YYYY-MM-DD", "amount": number, "description": "string" }],
  "sip_debits": [{ "date": "YYYY-MM-DD", "amount": number, "fund_name": "string" }],
  "insurance_premiums": [{ "date": "YYYY-MM-DD", "amount": number, "provider": "string" }],
  "expense_categories": {
    "food_delivery": number,
    "shopping": number,
    "subscriptions": number,
    "rent": number,
    "utilities": number,
    "transfers": number,
    "other": number
  },
  "average_monthly_income": number,
  "average_monthly_expenses": number
}

Rules:
- All amounts in INR (Indian Rupees), as numbers without commas or currency symbols
- For salary_credits: look for regular large credits (salary, wages, freelance payments)
- For emi_debits: look for recurring loan EMI debits (home loan, car loan, personal loan)
- For sip_debits: look for SIP/mutual fund debits (BSE, CAMS, KFintech, AMC names)
- For insurance_premiums: look for insurance company debits
- For expense_categories: aggregate by category. Food delivery = Swiggy, Zomato. Shopping = Amazon, Flipkart, Myntra. Subscriptions = Netflix, Spotify, YouTube, Hotstar.
- If data is unclear or not present, use 0 for numbers and empty arrays for lists
- Compute averages based on the statement period`;
}

export function buildMFStatementPrompt(): string {
  return `You are a financial document parser specializing in Indian mutual fund statements.

Analyze the CAMS or KFintech Consolidated Account Statement (CAS) images and extract ALL fund holdings.

Return EXACTLY this JSON structure:
{
  "funds": [
    {
      "fund_name": "string - full fund name",
      "folio_number": "string",
      "plan": "direct" or "regular",
      "current_value": number,
      "invested_value": number,
      "units": number,
      "nav": number,
      "sip_amount": number or null,
      "category": "equity" or "debt" or "hybrid" or "other"
    }
  ],
  "total_current_value": number,
  "total_invested_value": number
}

Rules:
- All amounts in INR as numbers
- Plan detection: look for "Direct" or "Regular" in the fund name. If contains "Direct Plan" or "Direct Growth", plan is "direct". Otherwise "regular"
- Category: "equity" for equity/index/ELSS/flexi cap/large cap/mid cap/small cap funds. "debt" for liquid/ultra short/short term/gilt/overnight funds. "hybrid" for balanced/aggressive hybrid/multi asset funds
- If SIP amount not visible, use null
- Sum up all fund current_values and invested_values for totals
- Handle both CAMS and KFintech statement formats`;
}

export function buildDematStatementPrompt(): string {
  return `You are a financial document parser specializing in Indian demat holding statements.

Analyze the demat/stock holding statement images from Zerodha, Groww, Angel One, CDSL, or NSDL.

Return EXACTLY this JSON structure:
{
  "holdings": [
    {
      "stock_name": "string - company name",
      "isin": "string - ISIN code (INE...)",
      "quantity": number,
      "average_price": number,
      "current_value": number
    }
  ],
  "total_value": number
}

Rules:
- All amounts in INR as numbers
- stock_name: use the common company name (e.g., "Infosys" not "INFOSYS LIMITED")
- If ISIN not visible, use empty string ""
- average_price: per-share average buy price
- current_value: total current market value for that holding (quantity * CMP)
- If average_price is not shown, use 0
- total_value: sum of all holdings' current_value`;
}
