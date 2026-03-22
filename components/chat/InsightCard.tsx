"use client";

import dynamic from "next/dynamic";

// Dynamic imports to avoid SSR issues with Recharts
const DonutChart = dynamic(
  () => import("@/components/charts/DonutChart").then((m) => m.DonutChart),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("@/components/charts/BarChart").then((m) => m.BarChart),
  { ssr: false }
);
const ComparisonChart = dynamic(
  () =>
    import("@/components/charts/ComparisonChart").then(
      (m) => m.ComparisonChart
    ),
  { ssr: false }
);

interface InsightCardProps {
  headline: string;
  keyNumber?: string;
  explanation: string;
  chartType?: "donut" | "bar" | "comparison";
  chartData?: Record<string, number>;
  isDemographic: boolean;
}

export function InsightCard({
  headline,
  keyNumber,
  explanation,
  chartType,
  chartData,
  isDemographic,
}: InsightCardProps) {
  return (
    <div className="ml-10 my-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-w-[90%]">
      {/* Coral accent bar */}
      <div className="h-1 bg-[#E94560]" />

      <div className="p-4">
        {/* Demographic label */}
        {isDemographic && (
          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider">
            Based on people like you
          </span>
        )}

        {/* Headline */}
        <h3 className="font-semibold text-base text-[#1A1A2E] mt-1">
          {headline}
        </h3>

        {/* Key number */}
        {keyNumber && (
          <div className="text-3xl font-bold text-[#1A1A2E] font-mono my-2">
            {keyNumber}
          </div>
        )}

        {/* Chart */}
        {chartType && chartData && (
          <>
            {chartType === "donut" && <DonutChart data={chartData} />}
            {chartType === "bar" && <BarChart data={chartData} />}
            {chartType === "comparison" && (
              <ComparisonChart data={chartData} />
            )}
          </>
        )}

        {/* Explanation */}
        <p className="text-sm text-[#6B7280] mt-2 leading-relaxed">
          {explanation}
        </p>
      </div>
    </div>
  );
}
