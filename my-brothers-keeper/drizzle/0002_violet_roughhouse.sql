ALTER TYPE "public"."visibility_scope" ADD VALUE 'custom';--> statement-breakpoint
DROP INDEX "meal_signups_meal_train_date_idx";--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "custom_user_ids" jsonb;--> statement-breakpoint
ALTER TABLE "meal_trains" ADD COLUMN "daily_capacity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "meal_trains" ADD COLUMN "custom_user_ids" jsonb;--> statement-breakpoint
ALTER TABLE "meal_trains" ADD COLUMN "custom_address_user_ids" jsonb;--> statement-breakpoint
ALTER TABLE "needs" ADD COLUMN "custom_user_ids" jsonb;