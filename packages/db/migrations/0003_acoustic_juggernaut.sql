CREATE TABLE "session_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"reps" integer,
	"weight_kg" numeric(6, 2),
	"rpe" numeric(3, 1),
	"rest_seconds" integer,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_sets_session_id_exercise_id_idx" ON "session_sets" USING btree ("session_id","exercise_id");