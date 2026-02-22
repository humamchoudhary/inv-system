// src/app/(protected)/sales/page.tsx
// Server component — all filtering done server-side via URL search params

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/db/service/user";
import { getUserActiveBusiness } from "@/db/service/business";
import { getBusinessSheets } from "@/db/service/sale-sheet";
import { db } from "@/db";
import { eq, and, gte, lte, like, SQL } from "drizzle-orm";
import { salesSheet, sales, transcription } from "@/db/schema";
import SalesClient, {
  type SaleEntry,
  type SheetSummary,
} from "@/components/SalesClient";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    sheet?: string; // sheet id — "all" or a uuid
    date?: string; // "today" | "week" | "month" | "all"
    view?: string; // "by-sale" | "by-item"
    q?: string; // item name search
    minPrice?: string;
    maxPrice?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

// ── Date helpers ───────────────────────────────────────────────────────────────

function getDateCutoff(filter: string): Date | null {
  const now = new Date();
  if (filter === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (filter === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (filter === "month") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null; // "all"
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function SalesRoute({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/signin");

  if (session.user.first_auth) {
    redirect("/welcome");
  }

  const params = await searchParams;

  // const user = await getUser(session.user.id);
  const business = await getUserActiveBusiness(session.user.id);
  if (!business) redirect("/");

  // ── Fetch all sheets ──
  const sheets = await getBusinessSheets(business.id);

  const sheetSummaries: SheetSummary[] = sheets.map((s) => ({
    id: s.id,
    name: s.name,
    createdAt: s.createdAt ? new Date(s.createdAt) : null,
  }));

  // ── Resolve active filters from URL ──
  const activeSheet = params.sheet ?? "all";
  const dateFilter = params.date ?? "week";
  const viewMode = params.view ?? "by-sale";
  const searchQuery = params.q ?? "";
  const minPrice = params.minPrice ?? "";
  const maxPrice = params.maxPrice ?? "";
  const dateFrom = params.dateFrom ?? "";
  const dateTo = params.dateTo ?? "";

  // ── Determine which sheets to query ──
  const targetSheets =
    activeSheet === "all" ? sheets : sheets.filter((s) => s.id === activeSheet);

  // ── Fetch sales server-side with filtering ──
  const allSalesArrays = await Promise.all(
    targetSheets.map(async (sheet) => {
      // Build where conditions
      const conditions: SQL[] = [eq(sales.sheet_id, sheet.id)];

      // Date filtering — custom range takes priority
      if (dateFrom) {
        conditions.push(gte(sales.createdAt, new Date(dateFrom)));
      } else if (dateTo) {
        // no-op for lower bound
      } else {
        const cutoff = getDateCutoff(dateFilter);
        if (cutoff) conditions.push(gte(sales.createdAt, cutoff));
      }

      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(sales.createdAt, end));
      }

      // Price filtering
      if (minPrice) {
        // Drizzle numeric comparison — cast via SQL
        conditions.push(gte(sales.price as any, minPrice));
      }
      if (maxPrice) {
        conditions.push(lte(sales.price as any, maxPrice));
      }

      const sheetSales = await db.query.sales.findMany({
        where: conditions.length === 1 ? conditions[0] : and(...conditions),
        with: {
          // no relations yet — transcription loaded separately
        },
        orderBy: (sales, { desc }) => [desc(sales.createdAt)],
      });

      return sheetSales
        .filter((s) => {
          // Item name filter (done in JS — LIKE on name)
          console.log(s.name.toLowerCase().includes(searchQuery.toLowerCase()));
          if (searchQuery) {
            return s.name.toLowerCase().includes(searchQuery.toLowerCase());
          }
          return true;
        })
        .map((s) => ({
          id: s.id,
          name: s.name,
          price: Number(s.price),
          createdAt: s.createdAt ? new Date(s.createdAt) : null,
          sheetId: sheet.id,
          transcriptionId: s.transcription_id,
        }));
    }),
  );

  const allSales: SaleEntry[] = allSalesArrays.flat();

  // ── Fetch transcription texts for session grouping ──
  const transcriptionIds = [
    ...new Set(allSales.map((s) => s.transcriptionId).filter(Boolean)),
  ];
  let transcriptionMap: Record<string, string> = {};
  if (transcriptionIds.length > 0) {
    const txRows = await db.query.transcription.findMany({
      where: (t, { inArray }) => inArray(t.id, transcriptionIds as string[]),
    });
    transcriptionMap = Object.fromEntries(txRows.map((t) => [t.id, t.text]));
  }

  // Attach transcription text to sale entries
  const salesWithTranscription: SaleEntry[] = allSales.map((s) => ({
    ...s,
    transcriptionText: s.transcriptionId
      ? transcriptionMap[s.transcriptionId]
      : undefined,
  }));

  // ── Summary stats ──
  const totalRevenue = salesWithTranscription.reduce(
    (sum, s) => sum + s.price,
    0,
  );
  const totalItems = salesWithTranscription.length;

  return (
    <SalesClient
      sheets={sheetSummaries}
      sales={salesWithTranscription}
      currencyCode={business.currency}
      businessName={business.name}
      // Active filter state (passed back for URL-driven UI)
      activeSheet={activeSheet}
      dateFilter={dateFilter}
      viewMode={viewMode}
      searchQuery={searchQuery}
      minPrice={minPrice}
      maxPrice={maxPrice}
      dateFrom={dateFrom}
      dateTo={dateTo}
      // Stats
      totalRevenue={totalRevenue}
      totalItems={totalItems}
    />
  );
}
