import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import salesSheet from "./sale-sheet";
import transcription from "./transcription";

const sales = pgTable("sales", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  transcription_id: text("transcription_id")
    .notNull()
    .references(() => transcription.id),
  sheet_id: text("sheet_id")
    .notNull()
    .references(() => salesSheet.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
});

// Infer the type from the sales table

// Type for when selecting from the database
export type Sale = InferSelectModel<typeof sales>;

// Type for when inserting into the database
export type NewSale = InferInsertModel<typeof sales>;

export default sales;
