import path from "path";
import dotenv from "dotenv";

// dotenv.config({
//   path: path.resolve(process.cwd(), ".env.local"),
// });

import type { Config } from "drizzle-kit";
console.log(process.env.DATABASE_URL);
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
