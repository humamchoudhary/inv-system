"use client";

// src/app/(protected)/dashboard/DashboardClient.tsx

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  FileText,
  Mic,
  BarChart2,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types (exported so page.tsx can import them)
// ─────────────────────────────────────────────

export type SheetSummary = {
  id: string;
  name: string;
  createdAt: Date | null;
};

export type SaleRow = {
  id: string;
  name: string;
  price: number;
  createdAt: string | null; // ISO string — safe to serialise from server
  sheetId: string;
};

export interface DashboardProps {
  businessName: string;
  currencyCode: string;
  sheets: SheetSummary[];
  activeSheet: string;
  dateFilter: string;
  currentSales: SaleRow[];
  previousSales: SaleRow[];
  totalRevenue: number;
  prevRevenue: number;
  totalItems: number;
  avgSale: number;
  topItem: string | null;
  revenueChange: number | null;
  itemsChange: number | null;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function fmt(amount: number, code = "USD") {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${Math.round(amount).toLocaleString()}`;
  }
}

function fmtCompact(amount: number, code = "USD") {
  try {
    // Only show decimal if it's not a whole number
    const hasDecimals = amount % 1 !== 0;

    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      notation: "compact",
      maximumFractionDigits: hasDecimals ? 1 : 0,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${amount}`;
  }
}

function buildUrl(params: Record<string, string>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v);
  }
  return `/dashboard?${p.toString()}`;
}

// Build daily revenue buckets for the trend chart
function buildTrendData(
  sales: SaleRow[],
  dateFilter: string,
): { label: string; revenue: number; date: string }[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let days = 7;
  if (dateFilter === "today") days = 1;
  else if (dateFilter === "week") days = 7;
  else if (dateFilter === "month") days = 30;
  else days = 30; // "all" — show last 30 days of trend

  const buckets: { label: string; revenue: number; date: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toISOString().split("T")[0];
    const label =
      days <= 7
        ? d.toLocaleDateString("en-US", { weekday: "short" })
        : days <= 14
          ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : i % 5 === 0
            ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "";
    buckets.push({ label, revenue: 0, date: dateStr });
  }

  for (const sale of sales) {
    if (!sale.createdAt) continue;
    const dateStr = sale.createdAt.split("T")[0];
    const bucket = buckets.find((b) => b.date === dateStr);
    if (bucket) bucket.revenue += sale.price;
  }

  return buckets;
}

// Build item breakdown
function buildItemBreakdown(
  sales: SaleRow[],
  totalRevenue: number,
): { name: string; qty: number; revenue: number; pct: number }[] {
  const map = new Map<
    string,
    { qty: number; revenue: number; displayName: string }
  >();
  for (const s of sales) {
    const key = s.name.toLowerCase().trim();
    if (!map.has(key))
      map.set(key, { qty: 0, revenue: 0, displayName: s.name });
    const item = map.get(key)!;
    item.qty += 1;
    item.revenue += s.price;
  }
  return [...map.values()]
    .map((v) => ({
      name: v.displayName,
      qty: v.qty,
      revenue: v.revenue,
      pct: totalRevenue > 0 ? (v.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8); // top 8 items
}

// Generate plain-language insights
function generateInsights(
  revenueChange: number | null,
  itemsChange: number | null,
  topItem: string | null,
  totalRevenue: number,
  totalItems: number,
  dateFilter: string,
): string[] {
  const insights: string[] = [];
  const period =
    dateFilter === "today"
      ? "yesterday"
      : dateFilter === "week"
        ? "last week"
        : dateFilter === "month"
          ? "last month"
          : "the previous period";

  if (revenueChange !== null && Math.abs(revenueChange) >= 1) {
    const dir = revenueChange > 0 ? "up" : "down";
    const pct = Math.abs(Math.round(revenueChange));
    insights.push(`Revenue is ${dir} ${pct}% compared to ${period}.`);
  } else if (totalRevenue === 0) {
    insights.push("No sales recorded in this period yet.");
  }

  if (topItem) {
    insights.push(
      `${topItem.charAt(0).toUpperCase() + topItem.slice(1)} is your best-selling item right now.`,
    );
  }

  if (itemsChange !== null && itemsChange > 20) {
    insights.push(`You're selling more items than ${period} — good momentum.`);
  }

  if (insights.length === 0 && totalItems > 0) {
    insights.push(
      `${totalItems} item${totalItems !== 1 ? "s" : ""} sold in this period.`,
    );
  }

  return insights.slice(0, 2);
}

const DATE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "30 Days", value: "month" },
  { label: "All Time", value: "all" },
];

// ─────────────────────────────────────────────
// Ambient background
// ─────────────────────────────────────────────

function Ambient() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none z-0">
      <div className="absolute top-[-10%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#1e1e1e] opacity-[0.13] blur-[130px]" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[360px] h-[360px] rounded-full bg-[#171717] opacity-[0.08] blur-[110px]" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Mini Sparkline Bar Chart (pure CSS/SVG)
// ─────────────────────────────────────────────

function TrendChart({
  data,
  currencyCode,

  todayStr,
}: {
  data: { label: string; revenue: number; date: string }[];
  currencyCode: string;

  todayStr: string;
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const hasData = data.some((d) => d.revenue > 0);
  const totalBars = data.length;
  const barW = 100 / totalBars;
  const gap = 0.6; // percentage gap between bars

  return (
    <div className="w-full">
      {/* Chart area */}
      <div className="relative h-28 w-full flex items-end gap-px">
        {data.map((d, i) => {
          const heightPct = max > 0 ? (d.revenue / max) * 100 : 0;

          const isToday = !!todayStr && d.date === todayStr;
          return (
            <div
              key={d.date}
              className="group relative flex-1 flex flex-col justify-end"
            >
              {/* Tooltip */}
              {d.revenue > 0 && (
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10 whitespace-nowrap">
                  <div className="px-2 py-1 rounded-lg bg-[#171717] text-white text-[10px] font-medium shadow-lg">
                    {fmtCompact(d.revenue, currencyCode)}
                  </div>
                  <div className="w-1.5 h-1.5 bg-[#171717] rotate-45 mx-auto -mt-[3px]" />
                </div>
              )}
              {/* Bar */}
              <div
                className={`w-full rounded-t-sm transition-all duration-500 ${
                  d.revenue === 0
                    ? "bg-[#f0f0f0]"
                    : isToday
                      ? "bg-[#171717]"
                      : "bg-[#1e1e1e] group-hover:bg-[#171717]"
                }`}
                style={{
                  height: `${Math.max(heightPct, d.revenue > 0 ? 4 : 2)}%`,
                  minHeight: "2px",
                  animationDelay: `${i * 30}ms`,
                }}
              />
            </div>
          );
        })}

        {/* Zero line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-[#f0f0f0]" />
      </div>

      {/* X-axis labels */}
      <div className="flex mt-2" style={{ gap: 0 }}>
        {data.map((d) => (
          <div key={d.date} className="flex-1 text-center">
            <span className="text-[9px] text-[#171717]/25 leading-none">
              {d.label}
            </span>
          </div>
        ))}
      </div>

      {!hasData && (
        <p className="text-center text-xs text-[#171717]/25 mt-2">
          No data for this period
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  change,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  change?: number | null;
  highlight?: boolean;
}) {
  const showChange = change !== null && change !== undefined;
  const up = (change ?? 0) >= 0;

  return (
    <div
      className={`flex flex-col gap-1 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${
        highlight
          ? "bg-[#171717]/5 border-[#171717]/20"
          : "bg-white border-[#f0f0f0]"
      }`}
    >
      <p className="text-[10px] font-medium text-[#171717]/40 uppercase tracking-widest">
        {label}
      </p>
      <p
        className={`text-xl font-bold tracking-tight tabular-nums ${highlight ? "text-[#171717]" : "text-[#171717]"}`}
      >
        {value}
      </p>
      {(sub || showChange) && (
        <div className="flex items-center gap-1.5 mt-0.5">
          {showChange && (
            <span
              className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                Math.abs(change!) < 1
                  ? "text-[#171717]/30"
                  : up
                    ? "text-emerald-500"
                    : "text-red-400"
              }`}
            >
              {Math.abs(change!) < 1 ? (
                <Minus className="w-2.5 h-2.5" />
              ) : up ? (
                <TrendingUp className="w-2.5 h-2.5" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5" />
              )}
              {Math.abs(change!) < 1
                ? "—"
                : `${Math.abs(Math.round(change!))}%`}
            </span>
          )}
          {sub && <p className="text-[10px] text-[#171717]/30">{sub}</p>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function DashboardClient({
  businessName,
  currencyCode,
  sheets,
  activeSheet,
  dateFilter,
  currentSales,
  previousSales,
  totalRevenue,
  prevRevenue,
  totalItems,
  avgSale,
  topItem,
  revenueChange,
  itemsChange,
}: DashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (overrides: Record<string, string>) => {
    const base = { sheet: activeSheet, date: dateFilter };
    startTransition(() => router.push(buildUrl({ ...base, ...overrides })));
  };

  const [todayStr, setTodayStr] = useState<string>("");

  useEffect(() => {
    setTodayStr(new Date().toISOString().split("T")[0]);
  }, []);

  // Derived data (all client-side since already filtered server-side)
  const trendData = useMemo(
    () => buildTrendData(currentSales, dateFilter),
    [currentSales, dateFilter],
  );

  const itemBreakdown = useMemo(
    () => buildItemBreakdown(currentSales, totalRevenue),
    [currentSales, totalRevenue],
  );

  const insights = useMemo(
    () =>
      generateInsights(
        revenueChange,
        itemsChange,
        topItem,
        totalRevenue,
        totalItems,
        dateFilter,
      ),
    [revenueChange, itemsChange, topItem, totalRevenue, totalItems, dateFilter],
  );

  const prevPeriodLabel =
    dateFilter === "today"
      ? "Yesterday"
      : dateFilter === "week"
        ? "Last week"
        : dateFilter === "month"
          ? "Last 30 days"
          : "Previous period";

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <main className="min-h-screen w-full bg-[#ffffff] flex flex-col font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Ambient />

      {/* ── Header ── */}
      <header
        className="relative z-10 flex items-center justify-between px-5 pt-10 pb-4"
        style={{ animation: "fadeDown 0.4s ease both" }}
      >
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#f0f0f0] hover:bg-[#1e1e1e]/30 transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-[#171717]/60" />
          </a>
          <div>
            <h1 className="text-[17px] font-semibold tracking-tight text-[#171717] leading-tight">
              Dashboard
            </h1>
            <p className="text-[11px] text-[#171717]/40">{businessName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPending && (
            <div className="w-1.5 h-1.5 rounded-full bg-[#171717] animate-pulse" />
          )}
          <a
            href="/record"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#171717] text-white text-xs font-semibold shadow-md shadow-[#171717]/30 hover:bg-[#171717]/90 active:scale-[0.97] transition-all duration-200"
          >
            <Mic className="w-3.5 h-3.5" />
            Record
          </a>
        </div>
      </header>

      <div className="relative z-10 mx-5 h-px bg-[#f0f0f0]" />

      {/* Scrollable body */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pt-4 pb-28 flex flex-col gap-5">
        {/* ── Date filter pills ── */}
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide"
          style={{ animation: "fadeUp 0.4s 0.05s ease both" }}
        >
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => navigate({ date: opt.value })}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 ${
                dateFilter === opt.value
                  ? "bg-[#171717] text-white shadow-sm"
                  : "bg-[#f0f0f0]/70 text-[#171717]/50 hover:text-[#171717]/70"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ── Sheet tabs ── */}
        {sheets.length > 1 && (
          <div style={{ animation: "fadeUp 0.4s 0.08s ease both" }}>
            <p className="text-[10px] font-medium text-[#171717]/30 uppercase tracking-widest mb-2">
              Sheet
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => navigate({ sheet: "all" })}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                  activeSheet === "all"
                    ? "bg-[#171717] text-white border-[#171717]"
                    : "bg-white text-[#171717]/50 border-[#f0f0f0] hover:border-[#1e1e1e]/50"
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                All Sheets
              </button>
              {sheets.map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => navigate({ sheet: sheet.id })}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                    activeSheet === sheet.id
                      ? "bg-[#171717] text-white border-[#171717] shadow-sm shadow-[#171717]/25"
                      : "bg-white text-[#171717]/50 border-[#f0f0f0] hover:border-[#1e1e1e]/50"
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  {sheet.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Hero revenue ── */}
        <div
          className="w-full rounded-3xl bg-[#171717] overflow-hidden relative"
          style={{ animation: "fadeUp 0.4s 0.1s ease both" }}
        >
          {/* Glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#171717] opacity-20 blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[#1e1e1e] opacity-10 blur-[40px] pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          <div className="relative z-10 px-6 py-5">
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-1">
              Total Revenue
            </p>
            <p className="text-4xl font-bold text-white tracking-tight tabular-nums leading-none">
              {fmt(totalRevenue, currencyCode)}
            </p>
            {revenueChange !== null && (
              <div className="flex items-center gap-1.5 mt-2">
                {revenueChange >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                )}
                <span
                  className={`text-xs font-semibold ${revenueChange >= 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {revenueChange >= 0 ? "+" : ""}
                  {Math.round(revenueChange)}%
                </span>
                <span className="text-xs text-white/30">
                  vs {prevPeriodLabel.toLowerCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── KPI grid ── */}
        <div
          className="grid grid-cols-2 gap-2"
          style={{ animation: "fadeUp 0.4s 0.15s ease both" }}
        >
          <KpiCard
            label="Items Sold"
            value={totalItems.toLocaleString()}
            change={itemsChange}
            sub="items"
          />
          <KpiCard
            label="Avg per Sale"
            value={fmt(avgSale, currencyCode)}
            sub="per item"
          />
          <KpiCard
            label="Prev Period"
            value={fmt(prevRevenue, currencyCode)}
            sub={prevPeriodLabel}
          />
          {topItem && (
            <KpiCard
              label="Top Item"
              value={topItem.charAt(0).toUpperCase() + topItem.slice(1)}
              highlight
            />
          )}
        </div>

        {/* ── Trend chart ── */}
        <div
          className="bg-white border border-[#f0f0f0] rounded-2xl p-5 shadow-sm shadow-black/[0.02]"
          style={{ animation: "fadeUp 0.4s 0.2s ease both" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-semibold text-[#171717]/40 uppercase tracking-widest">
              Revenue Trend
            </p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-[#171717]/30">
                <span className="w-2 h-2 rounded-sm bg-[#171717] inline-block" />
                Today
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#171717]/30">
                <span className="w-2 h-2 rounded-sm bg-[#1e1e1e] inline-block" />
                Other days
              </span>
            </div>
          </div>
          <TrendChart
            data={trendData}
            currencyCode={currencyCode}
            todayStr={todayStr}
          />
        </div>

        {/* ── Item breakdown ── */}
        {itemBreakdown.length > 0 && (
          <div
            className="bg-white border border-[#f0f0f0] rounded-2xl overflow-hidden shadow-sm shadow-black/[0.02]"
            style={{ animation: "fadeUp 0.4s 0.25s ease both" }}
          >
            <div className="px-5 py-3.5 border-b border-[#f0f0f0] bg-[#fafafa]">
              <p className="text-[10px] font-semibold text-[#171717]/40 uppercase tracking-widest">
                Item Performance
              </p>
            </div>

            {itemBreakdown.map((item, idx) => (
              <div
                key={item.name}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-[#f0f0f0] last:border-0 hover:bg-[#fdfcff] transition-colors duration-100"
              >
                {/* Rank */}
                <span className="text-[10px] font-bold text-[#171717]/20 w-4 shrink-0 tabular-nums">
                  {idx + 1}
                </span>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#171717] truncate capitalize">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 flex-1 rounded-full bg-[#f0f0f0] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#171717] to-[#1e1e1e] transition-all duration-700"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#171717]/30 tabular-nums w-7 text-right shrink-0">
                      {item.pct.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-col items-end shrink-0">
                  <p className="text-sm font-bold text-[#171717] tabular-nums">
                    {fmt(item.revenue, currencyCode)}
                  </p>
                  <p className="text-[10px] text-[#171717]/35">
                    {item.qty} {item.qty === 1 ? "sale" : "sales"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Insights ── */}
        {insights.length > 0 && (
          <div
            className="flex flex-col gap-2"
            style={{ animation: "fadeUp 0.4s 0.3s ease both" }}
          >
            <p className="text-[10px] font-semibold text-[#171717]/40 uppercase tracking-widest">
              Insights
            </p>
            {insights.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-[#] border border-[#1e1e1e]/30"
              >
                <div className="w-7 h-7 rounded-xl bg-[#171717]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#171717]" />
                </div>
                <p className="text-sm text-[#171717]/70 leading-relaxed">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {totalItems === 0 && (
          <div
            className="flex flex-col items-center justify-center py-12 gap-4"
            style={{ animation: "fadeUp 0.4s 0.2s ease both" }}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#f0f0f0] flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-[#171717]/25" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#171717]/50">
                No sales in this period
              </p>
              <p className="text-xs text-[#171717]/30 mt-1">
                Try selecting a different date range or sheet
              </p>
            </div>
            <a
              href="/record"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#171717] text-white text-sm font-semibold shadow-lg shadow-[#171717]/25 hover:bg-[#171717]/90 active:scale-[0.97] transition-all duration-200"
            >
              <Mic className="w-4 h-4" />
              Record a sale
            </a>
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <div className="fixed bottom-6 right-5 z-20">
        <a
          href="/record"
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#171717] text-white text-sm font-semibold shadow-2xl shadow-black/25 hover:bg-[#171717]/90 active:scale-[0.97] transition-all duration-200"
        >
          <div className="w-6 h-6 rounded-full bg-[#171717] flex items-center justify-center shadow-sm shadow-[#171717]/40">
            <Mic className="w-3.5 h-3.5 text-white" />
          </div>
          Record a sale
        </a>
      </div>

      <style>{`
        @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)}  to{opacity:1;transform:translateY(0)} }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>
    </main>
  );
}
