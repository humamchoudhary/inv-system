CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_name" text NOT NULL,
	"unit_price" numeric NOT NULL,
	"total_price" numeric NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"tax_percent" numeric
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" text NOT NULL;