ALTER TABLE "sales-sheet" DROP CONSTRAINT "sales-sheet_business_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sales-sheet" ADD CONSTRAINT "sales-sheet_business_id_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE cascade ON UPDATE cascade;