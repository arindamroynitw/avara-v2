"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ProgressNudgeProps {
  sections: Array<{ name: string; total: number; collected: number }>;
  currentChapter: number;
}

const SECTION_LABELS: Record<string, string> = {
  personal: "Personal",
  income: "Income",
  expenses: "Expenses",
  investments: "Investments",
  insurance: "Insurance",
  tax: "Tax",
  goals: "Goals & Risk",
};

export function ProgressNudge({
  sections,
  currentChapter,
}: ProgressNudgeProps) {
  const [expanded, setExpanded] = useState(false);

  const totalItems = sections.reduce((acc, s) => acc + s.total, 0);
  const totalCollected = sections.reduce((acc, s) => acc + s.collected, 0);

  return (
    <div className="mx-4 my-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {sections.map((s) => (
              <div
                key={s.name}
                className={`w-2 h-2 rounded-full ${
                  s.collected === s.total
                    ? "bg-[#059669]"
                    : s.collected > 0
                    ? "bg-[#D97706]"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-[#6B7280]">
            Chapter {currentChapter} · {totalCollected} of {totalItems} items
            covered
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-[#6B7280]" />
        ) : (
          <ChevronDown size={14} className="text-[#6B7280]" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-1.5">
          {sections.map((s) => (
            <div key={s.name} className="flex items-center justify-between">
              <span className="text-xs text-[#1A1A2E]">
                {SECTION_LABELS[s.name] || s.name}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: s.total }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < s.collected ? "bg-[#059669]" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
