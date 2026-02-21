import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

const transcription = pgTable("transcription", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export default transcription;
