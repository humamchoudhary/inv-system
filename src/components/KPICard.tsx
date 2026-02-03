import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  prefix?: string;
  suffix?: string;
  icon?: ReactNode;
}

export function KPICard({
  title,
  value,
  change,
  prefix = "",
  suffix = "",
  icon,
}: KPICardProps) {
  return (
    <div className="bg-background-sec rounded-xl p-6 shadow-sm border border-primary-sec/20 hover:border-primary/30 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-foreground/70 text-sm font-medium">{title}</h3>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline">
        <span className="text-3xl font-bold text-foreground">
          {prefix}
          {typeof value === "number" ? value.toLocaleString() : value}
          {suffix}
        </span>
        {change !== undefined && (
          <span
            className={`ml-3 flex items-center text-sm px-2 py-1 rounded-full ${change >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {change >= 0 ? (
              <ArrowUpIcon className="w-3 h-3 mr-1" />
            ) : (
              <ArrowDownIcon className="w-3 h-3 mr-1" />
            )}
            {Math.abs(change).toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}
