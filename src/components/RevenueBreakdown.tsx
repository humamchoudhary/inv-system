"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface RevenueBreakdownProps {
  products: Array<{
    productName: string;
    totalRevenue: number;
  }>;
}

export function RevenueBreakdown({ products }: RevenueBreakdownProps) {
  // Take top 5 products
  const topProducts = products.slice(0, 5);
  const otherRevenue = products
    .slice(5)
    .reduce((sum, p) => sum + p.totalRevenue, 0);

  const data = [
    ...topProducts.map((p) => ({
      name:
        p.productName.length > 20
          ? `${p.productName.substring(0, 20)}...`
          : p.productName,
      fullName: p.productName,
      value: p.totalRevenue,
      percentage: (
        (p.totalRevenue /
          (topProducts.reduce((sum, p) => sum + p.totalRevenue, 0) +
            otherRevenue)) *
        100
      ).toFixed(1),
    })),
    ...(otherRevenue > 0
      ? [
          {
            name: "Other",
            fullName: "Other Products",
            value: otherRevenue,
            percentage: (
              (otherRevenue /
                (topProducts.reduce((sum, p) => sum + p.totalRevenue, 0) +
                  otherRevenue)) *
              100
            ).toFixed(1),
          },
        ]
      : []),
  ];

  // Generate colors using your primary palette
  const generateColors = (count: number) => {
    const baseColor = { r: 255, g: 121, b: 198 }; // #ff79c6 in RGB
    const colors = [];

    for (let i = 0; i < count; i++) {
      const intensity = 0.7 + i * 0.05; // Gradually lighter
      const r = Math.round(baseColor.r * intensity);
      const g = Math.round(baseColor.g * intensity);
      const b = Math.round(baseColor.b * intensity);
      colors.push(`rgb(${r}, ${g}, ${b})`);
    }
    return colors;
  };

  const colors = generateColors(data.length);
  const totalRevenue = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-4 rounded-lg shadow-lg border border-primary-sec/30">
          <p className="font-semibold text-foreground mb-1">
            {data.fullName || data.name}
          </p>
          <p className="text-foreground/80">
            Revenue:{" "}
            <span className="font-semibold text-primary">
              ${data.value.toLocaleString()}
            </span>
          </p>
          <p className="text-foreground/60 text-sm">
            {data.percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-background-sec rounded-xl p-6 shadow-sm border border-primary-sec/20">
      <h3 className="text-foreground text-lg font-semibold mb-4">
        Revenue Breakdown by Product
      </h3>

      <div className="flex flex-col lg:flex-row items-center">
        {/* Pie Chart */}
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={false} // No labels on the chart
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index]}
                    stroke="tranparent"
                    strokeWidth={3}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
      </div>
    </div>
  );
}
