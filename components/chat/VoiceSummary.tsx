"use client";

import { useState } from "react";
import { Phone, ChevronDown, ChevronUp } from "lucide-react";

interface VoiceSummaryProps {
  durationSeconds: number;
  coveredTopics: string[];
  fullSummary: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function VoiceSummary({
  durationSeconds,
  coveredTopics,
  fullSummary,
}: VoiceSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ml-10 my-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-w-[85%]">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-[#0F3460] flex items-center justify-center">
            <Phone size={14} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[#1A1A2E]">
              Voice call
            </span>
            <span className="text-xs text-[#6B7280] ml-2">
              {formatDuration(durationSeconds)}
            </span>
          </div>
        </div>

        {/* Topics */}
        {coveredTopics.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-[#6B7280] mb-1">Covered:</p>
            <ul className="space-y-0.5">
              {coveredTopics.map((topic, i) => (
                <li
                  key={i}
                  className="text-sm text-[#1A1A2E] flex items-start gap-1.5"
                >
                  <span className="text-[#0F3460] mt-0.5">•</span>
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* View details toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-[#0F3460] hover:underline cursor-pointer mt-1"
        >
          {expanded ? "Hide details" : "View details"}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <p className="text-sm text-[#6B7280] mt-2 leading-relaxed">
            {fullSummary}
          </p>
        )}
      </div>
    </div>
  );
}
