import users from "../schema/users";
import { db } from "..";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { salesSheet } from "../schema";

export const createSheet = async (data: {
  name: string;
  business_id: string;
}) => {
  return await db
    .insert(salesSheet)
    .values({
      name: data.name,
      business_id: data.business_id,
    })
    .returning();
};

export async function getBusinessSheets(business_id: string) {
  return await db.query.salesSheet.findMany({
    where: eq(salesSheet.business_id, business_id),
  });
}
