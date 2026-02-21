// src/app/(protected)/sales/page.tsx
// Server component — fetches data, renders client SalesPage

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/db/service/user";
import { getUserActiveBusiness } from "@/db/service/business";
import { getBusinessSheets } from "@/db/service/sale-sheet";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { salesSheet, sales } from "@/db/schema";
import SalesPage, {
  type SaleEntry,
  type SheetSummary,
} from "@/components/Sales";

export default async function SalesRoute() {
  const session = await auth();
  if (!session) redirect("/signin");

  const user = await getUser(session.user.id);
  const business = await getUserActiveBusiness(
    session.user.id,
    user?.last_business!,
  );

  if (!business) redirect("/welcome");

  // Fetch sheets for this business
  const sheets = await getBusinessSheets(business.id);

  // Fetch all sales across all sheets for this business
  const allSalesArrays = await Promise.all(
    sheets.map(async (sheet) => {
      const sheetSales = await db.query.sales.findMany({
        where: eq(sales.sheet_id, sheet.id),
        with: {
          // If you add a transcription relation later, you can join here
        },
      });
      return sheetSales.map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        createdAt: s.createdAt ? new Date(s.createdAt) : null,
        sheetId: sheet.id,
        transcriptionText: undefined as string | undefined,
      }));
    }),
  );

  const allSales: SaleEntry[] = allSalesArrays.flat();

  const sheetSummaries: SheetSummary[] = sheets.map((s) => ({
    id: s.id,
    name: s.name,
    createdAt: s.createdAt ? new Date(s.createdAt) : null,
  }));

  return (
    <SalesPage
      sheets={sheetSummaries}
      sales={allSales}
      currencyCode={business.currency}
      businessName={business.name}
    />
  );
}
