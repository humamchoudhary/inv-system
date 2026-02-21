ALTER TABLE "sales-sheet" RENAME COLUMN "user_id" TO "business_id";--> statement-breakpoint
ALTER TABLE "sales-sheet" DROP CONSTRAINT "sales-sheet_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sales-sheet" ADD CONSTRAINT "sales-sheet_business_id_users_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;