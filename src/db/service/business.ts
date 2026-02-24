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
  console.log(user_id);

  const user = await getUser(user_id);
  console.log(user);

  if (!user) return null;

  // 1. Try last_business if it exists
  if (user.last_business) {
    const b = await db.query.business.findFirst({
      where: and(
        eq(business.id, user.last_business),
        eq(business.user_id, user_id),
      ),
    });

    console.log(b);

    if (b) {
      return b;
    }
  }

  // 2. Fallback: get first business for user
  const firstBusiness = await db.query.business.findFirst({
    where: eq(business.user_id, user_id),
  });

  console.log(firstBusiness);

  return firstBusiness ?? null;
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
