"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useMemo, useEffect } from "react";

interface RevenueChartProps {
  dailyData: Array<{ date: string; revenue: number }>;
  monthlyData: Array<{ month: string; revenue: number }>;
  title: string;
  selectedRange?: "7d" | "30d" | "90d" | "1y" | "all";
}

export function RevenueChart({
  dailyData,
  monthlyData,
  title,
  selectedRange = "30d",
}: RevenueChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "monthly">(
    "daily",
  );
  const [currentRange, setCurrentRange] = useState(selectedRange);

  // Update when selectedRange prop changes
  useEffect(() => {
    setCurrentRange(selectedRange);
  }, [selectedRange]);

  // Filter daily data based on selected range
  const filteredDailyData = useMemo(() => {
    if (currentRange === "all") return dailyData;

    const now = new Date();
    let cutoffDate = new Date();

    switch (currentRange) {
      case "7d":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return dailyData
      .filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= cutoffDate && itemDate <= now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dailyData, currentRange]);

  // Filter monthly data based on selected range
  const filteredMonthlyData = useMemo(() => {
    if (currentRange === "all") return monthlyData;

    const now = new Date();
    let cutoffDate = new Date();

    switch (currentRange) {
      case "7d":
      case "30d":
        // For short ranges, show last 6 months
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "90d":
        // For 90 days, show last 12 months
        cutoffDate.setMonth(now.getMonth() - 12);
        break;
      case "1y":
        // For 1 year, show last 24 months
        cutoffDate.setMonth(now.getMonth() - 24);
        break;
    }

    return monthlyData
      .filter((item) => {
        const itemDate = new Date(item.month);
        return itemDate >= cutoffDate && itemDate <= now;
      })
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime(),
      );
  }, [monthlyData, currentRange]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (selectedPeriod === "daily") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== new Date().getFullYear()
            ? "2-digit"
            : undefined,
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
  };

  const getCurrentData = () => {
    return selectedPeriod === "daily" ? filteredDailyData : filteredMonthlyData;
  };

  const calculateGrowth = () => {
    const data = getCurrentData();
    if (data.length < 2) return 0;

    const first = data[0].revenue;
    const last = data[data.length - 1].revenue;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  };

  const growth = calculateGrowth();
  const currentData = getCurrentData();
  const totalRevenue = currentData.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="bg-background-sec rounded-xl p-6 shadow-sm border border-primary-sec/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h3 className="text-foreground text-lg font-semibold">{title}</h3>
          <div className="flex items-center mt-1">
            <span className="text-foreground/70 text-sm mr-2">
              {selectedPeriod === "daily"
                ? `${filteredDailyData.length} days`
                : `${filteredMonthlyData.length} months`}
            </span>
            {growth !== 0 && (
              <span
                className={`text-sm px-2 py-1 rounded-full ${growth >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {growth >= 0 ? "↗" : "↘"} {Math.abs(growth).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <div className="inline-flex rounded-lg bg-background p-1 border border-primary-sec/30">
            <button
              onClick={() => setSelectedPeriod("daily")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === "daily"
                  ? "bg-primary text-white shadow-sm"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setSelectedPeriod("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === "monthly"
                  ? "bg-primary text-white shadow-sm"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--primary-sec)"
              opacity={0.3}
              vertical={false}
            />
            <XAxis
              dataKey={selectedPeriod === "daily" ? "date" : "month"}
              tickFormatter={formatDate}
              stroke="var(--foreground)"
              strokeOpacity={0.4}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "var(--primary-sec)", strokeOpacity: 0.3 }}
              minTickGap={selectedPeriod === "daily" ? 5 : 1}
            />
            <YAxis
              stroke="var(--foreground)"
              strokeOpacity={0.4}
              fontSize={12}
              tickFormatter={(value) =>
                `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toLocaleString()}`
              }
              tickLine={false}
              axisLine={{ stroke: "var(--primary-sec)", strokeOpacity: 0.3 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                borderColor: "var(--primary)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number | undefined) => [
                <span key="value" className="text-foreground font-semibold">
                  ${(value ?? 0).toLocaleString()}
                </span>,
                "Revenue",
              ]}
              labelFormatter={(label) => (
                <span className="text-foreground/70">
                  {selectedPeriod === "daily" ? "Date" : "Month"}:{" "}
                  {formatDate(label)}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--primary)"
              strokeWidth={3}
              dot={
                selectedPeriod === "monthly" || currentData.length <= 31
                  ? {
                      stroke: "var(--primary)",
                      strokeWidth: 2,
                      r: 4,
                      fill: "var(--background)",
                    }
                  : false
              }
              activeDot={{
                r: 6,
                stroke: "var(--background)",
                strokeWidth: 2,
                fill: "var(--primary)",
              }}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-sm text-foreground/60">
        <div className="flex items-center mb-2 sm:mb-0">
          <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
          <span>Revenue</span>
        </div>
        <div className="flex items-center space-x-4">
          <div>
            Total Revenue:{" "}
            <span className="font-medium text-foreground">
              ${totalRevenue.toLocaleString()}
            </span>
          </div>
          <div className="hidden sm:block">•</div>
          <div className="hidden sm:block">
            Avg Daily:{" "}
            <span className="font-medium text-foreground">
              $
              {selectedPeriod === "daily" && currentData.length > 0
                ? (totalRevenue / currentData.length).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 0, maximumFractionDigits: 0 },
                  )
                : "0"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
