"use server";
import { createSheet } from "@/db/service/sale-sheet";

export default async function createSheetAction(data: {
  name: string;
  business_id: string;
}) {
  const [res] = await createSheet(data);
  return res;
}
