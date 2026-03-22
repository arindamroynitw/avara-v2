"use client";

interface ComparisonChartProps {
  data: Record<string, number>;
}

export function ComparisonChart({ data }: ComparisonChartProps) {
  const entries = Object.entries(data);
  const maxValue = Math.max(...entries.map(([, v]) => v));

  const colors = ["#0F3460", "#E94560", "#059669", "#D97706"];

  return (
    <div className="space-y-3 my-3">
      {entries.map(([label, value], i) => (
        <div key={label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#6B7280]">{label}</span>
            <span className="text-xs font-medium text-[#1A1A2E] font-mono">
              {typeof value === "number" && value > 1000
                ? `₹${value.toLocaleString("en-IN")}`
                : `${value}%`}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(value / maxValue) * 100}%`,
                backgroundColor: colors[i % colors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
