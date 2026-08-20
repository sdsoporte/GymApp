ALTER TABLE "exercises" ADD COLUMN "external_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "muscle_group" text;--> statement-breakpoint
CREATE INDEX "exercises_body_part_equipment_target_idx" ON "exercises" USING btree ("body_part","equipment","target");--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_external_id_unique" UNIQUE("external_id");