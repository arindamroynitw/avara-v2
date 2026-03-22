"use client";

import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface DocumentStatusProps {
  documentType: string;
  status: "processing" | "parsed" | "failed";
  message: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  bank_statement: "Bank Statement",
  mf_statement: "Mutual Fund Statement",
  demat_statement: "Demat Holdings",
};

export function DocumentStatus({
  documentType,
  status,
  message,
}: DocumentStatusProps) {
  const label = DOC_TYPE_LABELS[documentType] || documentType;

  return (
    <div className="ml-10 my-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4 max-w-[85%]">
      <div className="flex items-center gap-3">
        {status === "processing" && (
          <Loader2 size={20} className="text-[#0F3460] animate-spin" />
        )}
        {status === "parsed" && (
          <CheckCircle size={20} className="text-[#059669]" />
        )}
        {status === "failed" && (
          <XCircle size={20} className="text-[#E94560]" />
        )}
        <div>
          <p className="text-sm font-medium text-[#1A1A2E]">{label}</p>
          <p className="text-xs text-[#6B7280]">{message}</p>
        </div>
      </div>
    </div>
  );
}
