import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  product_name: text("product_name").notNull(),
  unit_price: numeric("unit_price").notNull(),
  total_price: numeric("total_price").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  tax_percent: numeric("tax_percent"),
});

// Infer the type from the sales table

// Type for when selecting from the database
export type Sale = InferSelectModel<typeof sales>;

// Type for when inserting into the database
export type NewSale = InferInsertModel<typeof sales>;

export default sales;
