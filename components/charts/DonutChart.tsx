"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#0F3460", // Equity - accent blue
  "#E94560", // Debt - coral
  "#D97706", // Gold - amber
  "#059669", // Real Estate - green
  "#6B7280", // Other - gray
  "#1A1A2E", // Crypto - navy
  "#8B5CF6", // Hybrid - purple
];

interface DonutChartProps {
  data: Record<string, number>;
}

export function DonutChart({ data }: DonutChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="w-full h-48 my-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }) =>
              `${name} ${Math.round((value / total) * 100)}%`
            }
            labelLine={false}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              `₹${Number(value).toLocaleString("en-IN")}`
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
