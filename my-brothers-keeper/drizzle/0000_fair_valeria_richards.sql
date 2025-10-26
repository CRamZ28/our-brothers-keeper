CREATE TYPE "public"."claim_status" AS ENUM('claimed', 'completed', 'released');--> statement-breakpoint
CREATE TYPE "public"."digest_frequency" AS ENUM('immediate', 'daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('sent', 'accepted', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."invited_role" AS ENUM('admin', 'supporter');--> statement-breakpoint
CREATE TYPE "public"."min_role" AS ENUM('supporter', 'admin', 'primary');--> statement-breakpoint
CREATE TYPE "public"."need_category" AS ENUM('meals', 'rides', 'errands', 'childcare', 'household', 'other');--> statement-breakpoint
CREATE TYPE "public"."need_status" AS ENUM('open', 'claimed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'normal', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."recipient_type" AS ENUM('individual', 'group', 'all');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('going', 'maybe', 'declined');--> statement-breakpoint
CREATE TYPE "public"."update_type" AS ENUM('general', 'gratitude', 'memory', 'milestone');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('primary', 'admin', 'supporter', 'user');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'pending', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."visibility_scope" AS ENUM('private', 'all_supporters', 'group', 'role');--> statement-breakpoint
CREATE TABLE "admin_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"created_by" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_message_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"sender_id" varchar NOT NULL,
	"subject" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"recipient_type" "recipient_type" NOT NULL,
	"recipient_group_id" integer,
	"included_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_by" varchar NOT NULL,
	"visibility_scope" "visibility_scope" DEFAULT 'all_supporters' NOT NULL,
	"visibility_group_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"actor_user_id" varchar NOT NULL,
	"action" varchar(255) NOT NULL,
	"target_type" varchar(64) NOT NULL,
	"target_id" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"status" "rsvp_status" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp,
	"location" varchar(500),
	"created_by" varchar NOT NULL,
	"google_calendar_evt_id" varchar(255),
	"visibility_scope" "visibility_scope" DEFAULT 'all_supporters' NOT NULL,
	"visibility_group_id" integer,
	"min_role" "min_role",
	"capacity" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"primary_user_id" varchar NOT NULL,
	"quiet_mode" boolean DEFAULT false NOT NULL,
	"timezone" varchar(64) DEFAULT 'America/Chicago' NOT NULL,
	"delegate_admin_approvals" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"invited_email" varchar(320),
	"invited_phone" varchar(20),
	"invited_role" "invited_role" NOT NULL,
	"inviter_user_id" varchar NOT NULL,
	"status" "invite_status" DEFAULT 'sent' NOT NULL,
	"token" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"thread_id" varchar(64),
	"sender_user_id" varchar NOT NULL,
	"body" text NOT NULL,
	"visibility_scope" "visibility_scope" DEFAULT 'all_supporters' NOT NULL,
	"visibility_group_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "need_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"need_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"status" "claim_status" DEFAULT 'claimed' NOT NULL,
	"note" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "needs" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"details" text,
	"category" "need_category" NOT NULL,
	"priority" "priority" DEFAULT 'normal' NOT NULL,
	"due_at" timestamp,
	"recurrence" varchar(255),
	"created_by" varchar NOT NULL,
	"visibility_scope" "visibility_scope" DEFAULT 'all_supporters' NOT NULL,
	"visibility_group_id" integer,
	"status" "need_status" DEFAULT 'open' NOT NULL,
	"capacity" integer,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_prefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"channel_email" boolean DEFAULT true NOT NULL,
	"channel_sms" boolean DEFAULT false NOT NULL,
	"channel_push" boolean DEFAULT true NOT NULL,
	"digest_frequency" "digest_frequency" DEFAULT 'daily' NOT NULL,
	"urgent_needs_alerts" boolean DEFAULT true NOT NULL,
	"quiet_hours" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_prefs_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"author_id" varchar NOT NULL,
	"type" "update_type" DEFAULT 'general' NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"photo_urls" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar(320),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"profile_image_url" varchar(500),
	"name" text,
	"phone" varchar(20),
	"login_method" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"household_id" integer,
	"status" "user_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "admin_group_members_group_idx" ON "admin_group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "admin_group_members_user_idx" ON "admin_group_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_group_members_group_user_idx" ON "admin_group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "admin_groups_household_idx" ON "admin_groups" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "admin_message_recipients_message_idx" ON "admin_message_recipients" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "admin_message_recipients_user_idx" ON "admin_message_recipients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_messages_household_idx" ON "admin_messages" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "admin_messages_sender_idx" ON "admin_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "announcements_household_idx" ON "announcements" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "announcements_pinned_idx" ON "announcements" USING btree ("pinned");--> statement-breakpoint
CREATE INDEX "announcements_created_at_idx" ON "announcements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_household_idx" ON "audit_logs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "event_rsvps_event_user_idx" ON "event_rsvps" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "event_rsvps_user_idx" ON "event_rsvps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_household_idx" ON "events" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "events_start_at_idx" ON "events" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "events_visibility_idx" ON "events" USING btree ("visibility_scope");--> statement-breakpoint
CREATE UNIQUE INDEX "group_members_group_user_idx" ON "group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "group_members_user_idx" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "groups_household_idx" ON "groups" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "households_primary_user_idx" ON "households" USING btree ("primary_user_id");--> statement-breakpoint
CREATE INDEX "invites_household_idx" ON "invites" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "invites_token_idx" ON "invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invites_status_idx" ON "invites" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_household_idx" ON "messages" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "messages_thread_idx" ON "messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "need_claims_need_idx" ON "need_claims" USING btree ("need_id");--> statement-breakpoint
CREATE INDEX "need_claims_user_idx" ON "need_claims" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "need_claims_status_idx" ON "need_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "needs_household_idx" ON "needs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "needs_status_idx" ON "needs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "needs_category_idx" ON "needs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "needs_due_at_idx" ON "needs" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "notification_prefs_user_idx" ON "notification_prefs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expire_idx" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "updates_household_idx" ON "updates" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "updates_author_idx" ON "updates" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "updates_created_at_idx" ON "updates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_household_idx" ON "users" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");