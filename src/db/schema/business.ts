import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import users from "@/db/schema/users";

const business = pgTable("business", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  currency: text("curreny").notNull().default("USD"),
  business_type: text("business_type").notNull().default("Other"),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  createdAt: timestamp("created_at").defaultNow(),
});

import type { InferSelectModel } from "drizzle-orm";

export type Business = InferSelectModel<typeof business>;

export default business;
