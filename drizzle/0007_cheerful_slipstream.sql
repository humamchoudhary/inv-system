CREATE TABLE "sales-sheet" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "price" numeric NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "sheet_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sales-sheet" ADD CONSTRAINT "sales-sheet_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_sheet_id_sales-sheet_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."sales-sheet"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "unit_price";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "total_price";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "quantity";--> statement-breakpoint
ALTER TABLE "sales" DROP COLUMN "tax_percent";