"use client";

import { useState, useEffect, useCallback } from "react";
import { KPICard } from "@/components/KPICard";
import { RevenueChart } from "@/components/RevenueChart";
import { ProductsTable } from "@/components/ProductsTable";
import { RevenueBreakdown } from "@/components/RevenueBreakdown";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Users,
  RefreshCw,
} from "lucide-react";

interface AnalyticsData {
  kpis: {
    totalOrders: number;
    totalQuantity: number;
    grossRevenue: number;
    netRevenue: number;
    averageOrderValue: number;
    averageUnitPrice: number;
  };
  revenueByDay: Array<{ date: string; revenue: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  products: Array<{
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    avgUnitPrice: number;
  }>;
}

export default function Home() {
  const [dateRange, setDateRange] = useState<
    "7d" | "30d" | "90d" | "1y" | "all"
  >("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics?range=${dateRange}`, {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load analytics data");
      }

      setData(result.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load analytics data",
      );
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-foreground/70">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="p-4 rounded-full bg-red-100 text-red-600 inline-block mb-4">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Error Loading Data
          </h2>
          <p className="text-foreground/70 mb-6">
            {error || "Unable to load analytics data"}
          </p>
          <button
            onClick={fetchAnalytics}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { kpis, revenueByDay, revenueByMonth, products } = data;

  // Calculate growth percentages (you might want to fetch comparison data in real app)
  const calculateMockGrowth = (value: number) => {
    const base =
      dateRange === "7d"
        ? 0.9
        : dateRange === "30d"
          ? 0.85
          : dateRange === "90d"
            ? 0.8
            : dateRange === "1y"
              ? 0.75
              : 0.7;
    return ((value - value * base) / (value * base)) * 100;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-10 w-full">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Sales Analytics Dashboard
            </h1>
            <p className="text-foreground/60">
              Monitor your sales performance and product analytics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
            <DateRangeSelector
              onRangeChange={setDateRange}
              currentRange={dateRange}
            />
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-background-sec text-foreground rounded-lg hover:bg-primary-sec/20 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Gross Revenue"
          value={kpis.grossRevenue}
          prefix="$"
          change={calculateMockGrowth(kpis.grossRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KPICard
          title="Net Revenue"
          value={kpis.netRevenue}
          prefix="$"
          change={calculateMockGrowth(kpis.netRevenue)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KPICard
          title="Total Orders"
          value={kpis.totalOrders}
          change={calculateMockGrowth(kpis.totalOrders)}
          icon={<ShoppingCart className="w-5 h-5" />}
        />
        <KPICard
          title="Avg Order Value"
          value={kpis.averageOrderValue.toFixed(2)}
          prefix="$"
          change={calculateMockGrowth(kpis.averageOrderValue)}
          icon={<BarChart3 className="w-5 h-5" />}
        />
      </div>

      {/* Main Chart */}
      <div className="mb-8">
        <RevenueChart
          dailyData={revenueByDay}
          monthlyData={revenueByMonth}
          title="Revenue Trends"
        />
      </div>

      {/* Products & Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ProductsTable products={products} />
        </div>
        <div>
          <RevenueBreakdown products={products} />
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background-sec rounded-xl p-6 border border-primary-sec/20">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-primary/10 mr-4">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-foreground/70 text-sm">
                Total Quantity Sold
              </h4>
              <p className="text-2xl font-bold text-foreground">
                {kpis.totalQuantity.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-sm text-foreground/60">
            <span className="font-medium">{products.length}</span> products sold
          </div>
        </div>

        <div className="bg-background-sec rounded-xl p-6 border border-primary-sec/20">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-primary/10 mr-4">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-foreground/70 text-sm">Average Unit Price</h4>
              <p className="text-2xl font-bold text-foreground">
                ${kpis.averageUnitPrice.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="text-sm text-foreground/60">
            <span className="font-medium">
              ${kpis.averageUnitPrice.toFixed(2)}
            </span>{" "}
            per unit
          </div>
        </div>

        <div className="bg-background-sec rounded-xl p-6 border border-primary-sec/20">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-primary/10 mr-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-foreground/70 text-sm">Avg Daily Orders</h4>
              <p className="text-2xl font-bold text-foreground">
                {revenueByDay.length > 0
                  ? (kpis.totalOrders / revenueByDay.length).toFixed(1)
                  : "0"}
              </p>
            </div>
          </div>
          <div className="text-sm text-foreground/60">
            <span className="font-medium">{revenueByDay.length}</span> days in
            period
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-8 pt-6 border-t border-primary-sec/20">
        <div className="flex flex-col sm:flex-row justify-between text-sm text-foreground/60">
          <div className="mb-2 sm:mb-0">
            <span className="font-medium">Date Range:</span>{" "}
            {dateRange === "7d"
              ? "Last 7 Days"
              : dateRange === "30d"
                ? "Last 30 Days"
                : dateRange === "90d"
                  ? "Last 90 Days"
                  : dateRange === "1y"
                    ? "Last Year"
                    : "All Time"}
          </div>
          <div>
            <span className="font-medium">Data updated:</span>{" "}
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
