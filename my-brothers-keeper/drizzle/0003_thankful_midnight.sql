CREATE TABLE "meal_train_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_train_id" integer NOT NULL,
	"date" date NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"capacity_override" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meal_trains" ADD COLUMN "days_ahead_open" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "meal_trains" ADD COLUMN "availability_start_date" date;--> statement-breakpoint
ALTER TABLE "meal_trains" ADD COLUMN "availability_end_date" date;--> statement-breakpoint
CREATE UNIQUE INDEX "meal_train_days_meal_train_date_idx" ON "meal_train_days" USING btree ("meal_train_id","date");--> statement-breakpoint
CREATE INDEX "meal_train_days_meal_train_idx" ON "meal_train_days" USING btree ("meal_train_id");--> statement-breakpoint
CREATE INDEX "meal_train_days_date_idx" ON "meal_train_days" USING btree ("date");