import type { ConversationState } from "@/lib/types/conversation";
import type { ComponentInjection } from "@/lib/types/messages";

export function evaluateUploadCards(
  state: ConversationState
): ComponentInjection[] {
  const components: ComponentInjection[] = [];

  // Bank statement — after income discussed (ANY chapter, not just Ch2)
  if (
    state.collected.income.monthlyTakeHome &&
    state.documents.bankStatement === "not_uploaded"
  ) {
    components.push({
      type: "upload_card",
      data: {
        documentType: "bank_statement",
        rationale: "See your real spending patterns without guessing",
        howToGet:
          "Download from your bank's app or netbanking. Most banks: Statement → Download → PDF. Get at least 3 months.",
        dataReassurance:
          "Your documents are encrypted and only used to build your financial plan",
      },
      position: "after_response",
    });
  }

  // MF statement — after mutual funds mentioned (ANY chapter)
  if (
    state.collected.investments.mutualFunds &&
    state.documents.mfStatement === "not_uploaded"
  ) {
    components.push({
      type: "upload_card",
      data: {
        documentType: "mf_statement",
        rationale:
          "Get the complete picture of your mutual fund portfolio — every fund, every SIP",
        howToGet:
          "Visit camsonline.com or kfintech.com → Consolidated Account Statement → Enter PAN + email → PDF sent to your email.",
        dataReassurance:
          "Your documents are encrypted and only used to build your financial plan",
      },
      position: "after_response",
    });
  }

  // Demat statement — after stocks mentioned (ANY chapter)
  if (
    state.collected.investments.stocks &&
    state.documents.dematStatement === "not_uploaded"
  ) {
    components.push({
      type: "upload_card",
      data: {
        documentType: "demat_statement",
        rationale:
          "See your exact stock holdings and their current value",
        howToGet:
          "Download from your broker app (Zerodha, Groww, etc.) → Reports → Holdings or Portfolio → Download as PDF.",
        dataReassurance:
          "Your documents are encrypted and only used to build your financial plan",
      },
      position: "after_response",
    });
  }

  return components;
}
