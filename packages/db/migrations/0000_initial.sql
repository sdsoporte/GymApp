CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_es" text,
	"category" text,
	"equipment" text,
	"body_part" text,
	"target" text,
	"secondary_muscles" text[],
	"instructions_es" text,
	"image_url" text,
	"gif_url" text,
	"attribution" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "exercises_slug_unique" UNIQUE("slug")
);
