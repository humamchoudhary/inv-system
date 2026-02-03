import sales from "../schema/sale-entry";
import { db } from "..";
import { eq } from "drizzle-orm";
import { desc, sql, gte } from "drizzle-orm";

export type SaleInput = {
  product_name: string;
  unit_price?: number;
  quantity?: number;
  total_price?: number;
  tax_percent?: number;
  createdAt?: Date;
};

const resolvePricing = (data: SaleInput) => {
  const { unit_price, quantity, total_price } = data;

  const provided = [
    unit_price !== undefined,
    quantity !== undefined,
    total_price !== undefined,
  ].filter(Boolean).length;

  if (provided < 2) {
    throw new Error(
      "At least two of unit_price, quantity, total_price are required",
    );
  }

  if (unit_price != null && quantity != null && total_price == null) {
    return {
      unit_price,
      quantity,
      total_price: unit_price * quantity,
    };
  }

  if (unit_price != null && total_price != null && quantity == null) {
    return {
      unit_price,
      quantity: Math.round(total_price / unit_price),
      total_price,
    };
  }

  if (quantity != null && total_price != null && unit_price == null) {
    return {
      unit_price: total_price / quantity,
      quantity,
      total_price,
    };
  }

  return {
    unit_price: unit_price!,
    quantity: quantity!,
    total_price: total_price!,
  };
};

//===============================  CREATE  ================================//

export const createSale = async (data: SaleInput) => {
  if (!data.product_name) {
    throw new Error("product_name is required");
  }

  const pricing = resolvePricing(data);

  const [sale] = await db
    .insert(sales)
    .values({
      product_name: data.product_name,
      unit_price: pricing.unit_price.toString(),
      quantity: pricing.quantity,
      total_price: pricing.total_price.toString(),
      tax_percent: (data.tax_percent ?? 0).toString(),
      createdAt: data.createdAt,
    })
    .returning();

  return sale;
};

//===============================  UPDATE  ================================//

export const updateSale = async (id: number, data: Partial<SaleInput>) => {
  const existing = await getSaleById(id);

  const pricing = resolvePricing({
    product_name: existing.product_name,
    unit_price: data.unit_price ?? Number(existing.unit_price),
    quantity: data.quantity ?? existing.quantity,
    total_price: data.total_price ?? Number(existing.total_price),
  });

  const [updated] = await db
    .update(sales)
    .set({
      product_name: data.product_name ?? existing.product_name,
      unit_price: pricing.unit_price.toString(),
      quantity: pricing.quantity,
      total_price: pricing.total_price.toString(),
      tax_percent: (data.tax_percent ?? existing.tax_percent ?? "0").toString(),
      createdAt: data.createdAt ?? existing.createdAt,
    })
    .where(eq(sales.id, id))
    .returning();

  return updated;
};

//===============================  READ  ================================//

export const listSales = async () => {
  return db.query.sales.findMany({
    orderBy: (sales, { desc }) => [desc(sales.createdAt)],
  });
};

export const getSaleById = async (id: number) => {
  const sale = await db.query.sales.findFirst({
    where: eq(sales.id, id),
  });

  if (!sale) {
    throw new Error("Sale not found");
  }

  return sale;
};

export const getSalesAnalytics = async (
  dateRange: "7d" | "30d" | "90d" | "1y" | "all" = "30d",
) => {
  // Calculate date filters
  const now = new Date();
  let startDate: Date | null = null;

  switch (dateRange) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      startDate = null;
      break;
  }

  const [kpis, revenueByDay, revenueByMonth, productAnalytics] =
    await Promise.all([
      // 🔹 CORE KPIs with date filter - using explicit casting
      db
        .select({
          totalOrders: sql<number>`cast(count(*) as integer)`.as("totalOrders"),
          totalQuantity:
            sql<number>`cast(coalesce(sum(${sales.quantity}), 0) as integer)`.as(
              "totalQuantity",
            ),
          grossRevenue:
            sql<number>`cast(coalesce(sum(${sales.total_price}), 0) as decimal(10,2))`.as(
              "grossRevenue",
            ),
          netRevenue: sql<number>`
            cast(
              coalesce(
                sum(
                  ${sales.total_price} +
                  (${sales.total_price} * coalesce(${sales.tax_percent}, 0) / 100)
                ),
                0
              ) as decimal(10,2)
            )
          `.as("netRevenue"),
          averageOrderValue:
            sql<number>`cast(coalesce(avg(${sales.total_price}), 0) as decimal(10,2))`.as(
              "averageOrderValue",
            ),
          averageUnitPrice:
            sql<number>`cast(coalesce(avg(${sales.unit_price}), 0) as decimal(10,2))`.as(
              "averageUnitPrice",
            ),
        })
        .from(sales)
        .where(startDate ? gte(sales.createdAt, startDate) : undefined),

      // 🔹 REVENUE BY DAY with date filter
      db
        .select({
          date: sql<string>`date(${sales.createdAt})`.as("date"),
          revenue:
            sql<number>`cast(coalesce(sum(${sales.total_price}), 0) as decimal(10,2))`.as(
              "revenue",
            ),
        })
        .from(sales)
        .where(startDate ? gte(sales.createdAt, startDate) : undefined)
        .groupBy(sql`date(${sales.createdAt})`)
        .orderBy(sql`date(${sales.createdAt})`),

      // 🔹 REVENUE BY MONTH with date filter
      db
        .select({
          month: sql<string>`date_trunc('month', ${sales.createdAt})`.as(
            "month",
          ),
          revenue:
            sql<number>`cast(coalesce(sum(${sales.total_price}), 0) as decimal(10,2))`.as(
              "revenue",
            ),
        })
        .from(sales)
        .where(startDate ? gte(sales.createdAt, startDate) : undefined)
        .groupBy(sql`date_trunc('month', ${sales.createdAt})`)
        .orderBy(sql`date_trunc('month', ${sales.createdAt})`),

      // 🔹 PRODUCT ANALYTICS with date filter
      db
        .select({
          productName: sales.product_name,
          totalQuantity:
            sql<number>`cast(coalesce(sum(${sales.quantity}), 0) as integer)`.as(
              "totalQuantity",
            ),
          totalRevenue:
            sql<number>`cast(coalesce(sum(${sales.total_price}), 0) as decimal(10,2))`.as(
              "totalRevenue",
            ),
          avgUnitPrice:
            sql<number>`cast(coalesce(avg(${sales.unit_price}), 0) as decimal(10,2))`.as(
              "avgUnitPrice",
            ),
        })
        .from(sales)
        .where(startDate ? gte(sales.createdAt, startDate) : undefined)
        .groupBy(sales.product_name)
        .orderBy(desc(sql`sum(${sales.total_price})`)),
    ]);

  // Helper function to ensure numbers
  const ensureNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Process and ensure all values are numbers
  const processedKpis = kpis[0]
    ? {
        totalOrders: ensureNumber(kpis[0].totalOrders),
        totalQuantity: ensureNumber(kpis[0].totalQuantity),
        grossRevenue: ensureNumber(kpis[0].grossRevenue),
        netRevenue: ensureNumber(kpis[0].netRevenue),
        averageOrderValue: ensureNumber(kpis[0].averageOrderValue),
        averageUnitPrice: ensureNumber(kpis[0].averageUnitPrice),
      }
    : {
        totalOrders: 0,
        totalQuantity: 0,
        grossRevenue: 0,
        netRevenue: 0,
        averageOrderValue: 0,
        averageUnitPrice: 0,
      };

  const processedRevenueByDay = revenueByDay.map((item) => ({
    date: item.date,
    revenue: ensureNumber(item.revenue),
  }));

  const processedRevenueByMonth = revenueByMonth.map((item) => ({
    month: item.month,
    revenue: ensureNumber(item.revenue),
  }));

  const processedProducts = productAnalytics.map((item) => ({
    productName: item.productName,
    totalQuantity: ensureNumber(item.totalQuantity),
    totalRevenue: ensureNumber(item.totalRevenue),
    avgUnitPrice: ensureNumber(item.avgUnitPrice),
  }));

  return {
    kpis: processedKpis,
    revenueByDay: processedRevenueByDay,
    revenueByMonth: processedRevenueByMonth,
    products: processedProducts,
  };
};
