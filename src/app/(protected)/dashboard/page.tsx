// src/app/(protected)/dashboard/page.tsx
// Server component — fetches all dashboard data server-side

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/db/service/user";
import { getUserActiveBusiness } from "@/db/service/business";
import { getBusinessSheets } from "@/db/service/sale-sheet";
import { db } from "@/db";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { salesSheet, sales } from "@/db/schema";
import DashboardClient, {
  type SheetSummary,
  type SaleRow,
  type DashboardProps,
} from "@/components/Dashboard";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    sheet?: string; // sheet id or "all"
    date?: string; // "today" | "week" | "month" | "all"
  }>;
}

// ── Date helpers ───────────────────────────────────────────────────────────────

function getDateRange(filter: string): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  if (filter === "today") {
    return { from, to };
  }
  if (filter === "week") {
    from.setDate(from.getDate() - 6); // last 7 days including today
    return { from, to };
  }
  if (filter === "month") {
    from.setDate(from.getDate() - 29); // last 30 days
    return { from, to };
  }
  // "all" — go back 1 year as a reasonable default
  from.setFullYear(from.getFullYear() - 1);
  return { from, to };
}

// previous period of same length for comparison
function getPreviousDateRange(filter: string): { from: Date; to: Date } {
  const { from, to } = getDateRange(filter);
  const diffMs = to.getTime() - from.getTime();
  return {
    from: new Date(from.getTime() - diffMs - 1),
    to: new Date(from.getTime() - 1),
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/signin");

  const params = await searchParams;
  const dateFilter = params.date ?? "week";
  const activeSheet = params.sheet ?? "all";

  const user = await getUser(session.user.id);
  const business = await getUserActiveBusiness(session.user.id);
  if (!business) redirect("/welcome");

  // ── Fetch sheets ──
  const sheets = await getBusinessSheets(business.id);
  if (sheets.length === 0) redirect("/"); // no sheets = no sales yet

  const sheetSummaries: SheetSummary[] = sheets.map((s) => ({
    id: s.id,
    name: s.name,
    createdAt: s.createdAt ? new Date(s.createdAt) : null,
  }));

  // ── Determine which sheets to query ──
  const targetSheetIds =
    activeSheet === "all"
      ? sheets.map((s) => s.id)
      : sheets.filter((s) => s.id === activeSheet).map((s) => s.id);

  if (targetSheetIds.length === 0) redirect("/dashboard");

  // ── Current period sales ──
  const { from, to } = getDateRange(dateFilter);

  const currentSales = await db.query.sales.findMany({
    where: and(
      inArray(sales.sheet_id, targetSheetIds),
      gte(sales.createdAt, from),
      lte(sales.createdAt, to),
    ),
    orderBy: (sales, { asc }) => [asc(sales.createdAt)],
  });

  // ── Previous period sales (for comparison) ──
  const { from: prevFrom, to: prevTo } = getPreviousDateRange(dateFilter);
  const previousSales = await db.query.sales.findMany({
    where: and(
      inArray(sales.sheet_id, targetSheetIds),
      gte(sales.createdAt, prevFrom),
      lte(sales.createdAt, prevTo),
    ),
  });

  // ── Map to serialisable rows ──
  const toRows = (rows: typeof currentSales): SaleRow[] =>
    rows.map((s) => ({
      id: s.id,
      name: s.name,
      price: Number(s.price),
      createdAt: s.createdAt ? s.createdAt.toISOString() : null,
      sheetId: s.sheet_id,
    }));

  const currentRows = toRows(currentSales);
  const previousRows = toRows(previousSales);

  // ── Compute KPIs server-side ──
  const totalRevenue = currentRows.reduce((s, r) => s + r.price, 0);
  const prevRevenue = previousRows.reduce((s, r) => s + r.price, 0);
  const totalItems = currentRows.length;
  const avgSale = totalItems > 0 ? totalRevenue / totalItems : 0;

  // Top item by revenue
  const itemMap = new Map<string, number>();
  for (const r of currentRows) {
    const key = r.name.toLowerCase().trim();
    itemMap.set(key, (itemMap.get(key) ?? 0) + r.price);
  }
  const topItem =
    itemMap.size > 0
      ? [...itemMap.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : null;

  // Revenue change %
  const revenueChange =
    prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;

  // Items change
  const itemsChange =
    previousRows.length > 0
      ? ((totalItems - previousRows.length) / previousRows.length) * 100
      : null;

  return (
    <DashboardClient
      businessName={business.name}
      currencyCode={business.currency}
      sheets={sheetSummaries}
      activeSheet={activeSheet}
      dateFilter={dateFilter}
      currentSales={currentRows}
      previousSales={previousRows}
      totalRevenue={totalRevenue}
      prevRevenue={prevRevenue}
      totalItems={totalItems}
      avgSale={avgSale}
      topItem={topItem}
      revenueChange={revenueChange}
      itemsChange={itemsChange}
    />
  );
}
