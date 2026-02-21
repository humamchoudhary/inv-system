// relations.ts
import { relations } from "drizzle-orm";

import users from "./schema/users";
import business from "./schema/business";
/* Users → Businesses (owned businesses) */
export const usersRelations = relations(users, ({ many, one }) => ({
  businesses: many(business),
  lastBusiness: one(business, {
    fields: [users.last_business],
    references: [business.id],
  }),
}));

/* Business → Owner */
export const businessRelations = relations(business, ({ one }) => ({
  owner: one(users, {
    fields: [business.user_id],
    references: [users.id],
  }),
}));
