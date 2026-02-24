import sales from "../schema/sale-entry";
import { db } from "..";
import { transcription } from "../schema";
import { eq } from "drizzle-orm";

interface SaleItem {
  id: string; // local only — for keying rows
  name: string;
  price: number;
}

export const createEntry = async (data: {
  items: SaleItem[];
  transcription: string;
  sheetId: string;
  date?: string; // ISO string
}) => {
  const saleDate = data.date ? new Date(data.date) : new Date();

  const [insertedTranscription] = await db
    .insert(transcription)
    .values({ text: data.transcription, createdAt: saleDate })
    .returning();

  const salesWithExtras = data.items.map((entry) => ({
    ...entry,
    price: entry.price.toString(),
    transcription_id: insertedTranscription.id,
    sheet_id: data.sheetId,
    createdAt: saleDate,
  }));

  return await db.insert(sales).values(salesWithExtras).returning();
};

export const getSalesEntries = async (sheet_id: string) => {
  return await db.query.sales.findMany({
    where: eq(sales.sheet_id, sheet_id),
  });
};
