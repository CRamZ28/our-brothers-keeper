CREATE TYPE "public"."notification_channel" AS ENUM('email', 'push');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('need_created', 'need_claimed', 'need_completed', 'event_created', 'event_rsvp', 'meal_train_signup', 'meal_train_cancelled', 'new_message', 'new_announcement', 'new_update', 'invite_sent');--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"household_id" integer NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"metadata" jsonb,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"delivered" boolean DEFAULT false NOT NULL,
	"delivered_at" timestamp,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"household_id" integer NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"email_need_created" boolean DEFAULT true NOT NULL,
	"email_need_claimed" boolean DEFAULT true NOT NULL,
	"email_need_completed" boolean DEFAULT true NOT NULL,
	"email_event_created" boolean DEFAULT true NOT NULL,
	"email_event_rsvp" boolean DEFAULT true NOT NULL,
	"email_meal_train_signup" boolean DEFAULT true NOT NULL,
	"email_meal_train_cancelled" boolean DEFAULT true NOT NULL,
	"email_new_message" boolean DEFAULT true NOT NULL,
	"email_new_announcement" boolean DEFAULT true NOT NULL,
	"email_new_update" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"push_need_created" boolean DEFAULT true NOT NULL,
	"push_need_claimed" boolean DEFAULT false NOT NULL,
	"push_need_completed" boolean DEFAULT false NOT NULL,
	"push_event_created" boolean DEFAULT true NOT NULL,
	"push_event_rsvp" boolean DEFAULT false NOT NULL,
	"push_meal_train_signup" boolean DEFAULT true NOT NULL,
	"push_meal_train_cancelled" boolean DEFAULT true NOT NULL,
	"push_new_message" boolean DEFAULT true NOT NULL,
	"push_new_announcement" boolean DEFAULT true NOT NULL,
	"push_new_update" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh_key" text NOT NULL,
	"auth_key" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "notification_logs_user_idx" ON "notification_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_logs_household_idx" ON "notification_logs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "notification_logs_sent_at_idx" ON "notification_logs" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "notification_logs_type_idx" ON "notification_logs" USING btree ("notification_type");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_user_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_preferences_household_idx" ON "notification_preferences" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");