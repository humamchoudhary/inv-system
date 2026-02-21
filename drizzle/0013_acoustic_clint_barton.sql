CREATE TABLE "transcription" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "transcription_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_transcription_id_transcription_id_fk" FOREIGN KEY ("transcription_id") REFERENCES "public"."transcription"("id") ON DELETE no action ON UPDATE no action;