import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import type { InferSelectModel } from "drizzle-orm";
import business from "./business";

const salesSheet = pgTable("sales-sheet", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),

  // relations
  business_id: text("business_id")
    .notNull()
    .references(() => business.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
});

// Infer the type from the sales table

export type saleSheetType = InferSelectModel<typeof salesSheet>;

export default salesSheet;
