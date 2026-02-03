"use client";

import { Calendar, Filter } from "lucide-react";
import { useState } from "react";

interface DateRangeSelectorProps {
  onRangeChange: (range: "7d" | "30d" | "90d" | "1y" | "all") => void;
  currentRange?: string;
}

export function DateRangeSelector({
  onRangeChange,
  currentRange = "30d",
}: DateRangeSelectorProps) {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "1y" | "all">(
    currentRange as any,
  );

  const handleRangeChange = (newRange: "7d" | "30d" | "90d" | "1y" | "all") => {
    setRange(newRange);
    onRangeChange(newRange);
  };

  const ranges = [
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "90 Days", value: "90d" },
    { label: "1 Year", value: "1y" },
    { label: "All Time", value: "all" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
      <div className="flex items-center space-x-2 text-foreground/70">
        <Calendar className="w-5 h-5" />
        <span className="text-sm font-medium">Date Range:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ranges.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleRangeChange(value as any)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              range === value
                ? "bg-primary text-white shadow-sm"
                : "bg-background-sec text-foreground hover:bg-primary-sec/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
