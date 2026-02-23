import { and, eq } from "drizzle-orm";
import { db } from "..";
import { business, salesSheet, users, sales } from "../schema";
import { getUser } from "./user";

export async function createBusiness(
  name: string,
  business_type: string,
  currency: string,
  user_id: string,
) {
  const [b] = await db
    .insert(business)
    .values({
      name,
      business_type,
      currency,
      user_id,
    })
    .returning({ id: business.id });

  await db
    .update(users)
    .set({
      first_auth: false,
      last_business: b.id,
    })
    .where(eq(users.id, user_id));
}

export async function getUserActiveBusiness(user_id: string) {
  const user = await getUser(user_id);
  if (user && user!.last_business) {
    return await db.query.business.findFirst({
      where: and(
        eq(business.id, user!.last_business),
        eq(business.user_id, user_id),
      ),
    });
  } else {
    return null;
  }
}

export async function getUserBusinesses(user_id: string) {
  return await db.query.business.findMany({
    where: eq(business.user_id, user_id),
  });
}

export async function getTotalSales(business_id: string) {
  // 1️⃣ Get all sheets for the business
  const businessSheets = await db.query.salesSheet.findMany({
    where: eq(salesSheet.business_id, business_id),
  });

  // 2️⃣ Fetch all sales concurrently
  const allSalesArrays = await Promise.all(
    businessSheets.map((sheet) =>
      db.query.sales.findMany({
        where: eq(sales.sheet_id, sheet.id),
      }),
    ),
  );

  // 3️⃣ Flatten the array of arrays
  const allSales = allSalesArrays.flat();

  // 4️⃣ Compute totalSales (convert price to number before summing)
  const totalSales = allSales.reduce(
    (sum, sale) => sum + Number(sale.price),
    0,
  );

  // 5️⃣ Count items sold
  const itemsSold = allSales.length;

  return {
    allSales,
    totalSales,
    itemsSold,
    entries: businessSheets.length,
  };
}
