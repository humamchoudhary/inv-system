import type { InferSelectModel } from "drizzle-orm";
import type business from "@/db/schema/business";
import { type saleSheetType } from "@/db/schema/sale-sheet";

export type Business = InferSelectModel<typeof business>;

export type PageState =
  | "sheet-select"
  | "sheet-create"
  | "recording"
  | "processing"
  | "review"
  | "success"
  | "error";

export interface SaleItem {
  id: string;
  name: string;
  price: number;
}

export interface ApiResponse {
  data: { name: string; price: number }[];
  transcription: string;
  error: boolean;
  message?: string;
  date: string;
}

export interface RecordPageProps {
  activeBusiness?: Business;
  sheets?: saleSheetType[];
  onSave?: (payload: {
    items: SaleItem[];
    transcription: string;
    sheetId: string;
    date?: string;
  }) => Promise<void>;
}
