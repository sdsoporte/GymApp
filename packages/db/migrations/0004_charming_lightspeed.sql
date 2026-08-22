CREATE TABLE "body_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"measured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"weight_kg" numeric(5, 2),
	"body_fat_percent" numeric(4, 1),
	"waist_cm" numeric(5, 1),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "body_metrics_measured_at_idx" ON "body_metrics" USING btree ("measured_at");