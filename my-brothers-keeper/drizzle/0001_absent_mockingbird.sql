CREATE TYPE "public"."meal_signup_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "meal_signups" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_train_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"delivery_date" timestamp NOT NULL,
	"status" "meal_signup_status" DEFAULT 'confirmed' NOT NULL,
	"notes" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_trains" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"location" text,
	"people_count" integer,
	"favorite_meals" text,
	"allergies" text,
	"dislikes" text,
	"special_instructions" text,
	"visibility_scope" "visibility_scope" DEFAULT 'all_supporters' NOT NULL,
	"visibility_group_id" integer,
	"address_visibility_scope" "visibility_scope" DEFAULT 'all_supporters' NOT NULL,
	"address_visibility_group_id" integer,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "meal_signups_meal_train_idx" ON "meal_signups" USING btree ("meal_train_id");--> statement-breakpoint
CREATE INDEX "meal_signups_user_idx" ON "meal_signups" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meal_signups_delivery_date_idx" ON "meal_signups" USING btree ("delivery_date");--> statement-breakpoint
CREATE UNIQUE INDEX "meal_signups_meal_train_date_idx" ON "meal_signups" USING btree ("meal_train_id","delivery_date");--> statement-breakpoint
CREATE INDEX "meal_trains_household_idx" ON "meal_trains" USING btree ("household_id");