"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ProfileSectionProps {
  name: string;
  label: string;
  icon: string;
  collected: number;
  total: number;
  missing: string[];
  summary?: string;
  children: React.ReactNode;
}

export function ProfileSection({
  name,
  label,
  icon,
  collected,
  total,
  missing,
  summary,
  children,
}: ProfileSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const isComplete = collected >= total;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-[#1A1A2E]">{label}</h3>
              {isComplete ? (
                <CheckCircle size={14} className="text-[#059669]" />
              ) : (
                <div className="flex items-center gap-1">
                  <AlertCircle size={14} className="text-[#D97706]" />
                  <span className="text-[10px] text-[#D97706]">
                    {collected}/{total}
                  </span>
                </div>
              )}
            </div>
            {summary && (
              <p className="text-xs text-[#6B7280] mt-0.5">{summary}</p>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-[#9CA3AF]" />
        ) : (
          <ChevronDown size={16} className="text-[#9CA3AF]" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <div className="pt-3 space-y-2">{children}</div>

          {!isComplete && missing.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-xs text-[#6B7280] mb-1">
                Missing: {missing.join(", ")}
              </p>
              <Link
                href={`/chat?section=${name}`}
                className="text-xs text-[#0F3460] hover:underline"
              >
                Continue in chat →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
