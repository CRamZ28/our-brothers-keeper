// server/_vercel/handler.ts
import "dotenv/config";

// server/_core/app.ts
import * as Sentry from "@sentry/node";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";

// server/db.ts
import { and, eq, inArray, desc, sql, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// drizzle/schema.ts
import {
  boolean,
  serial,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  jsonb,
  index,
  uniqueIndex,
  integer,
  date,
  real
} from "drizzle-orm/pg-core";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("sessions_expire_idx").on(table.expire)]
);
var userRoleEnum = pgEnum("user_role", ["primary", "admin", "supporter", "user"]);
var userStatusEnum = pgEnum("user_status", ["active", "pending", "blocked"]);
var invitedRoleEnum = pgEnum("invited_role", ["primary", "admin", "supporter"]);
var inviteStatusEnum = pgEnum("invite_status", ["sent", "accepted", "revoked", "expired"]);
var visibilityScopeEnum = pgEnum("visibility_scope", ["private", "all_supporters", "group", "role", "custom"]);
var minRoleEnum = pgEnum("min_role", ["supporter", "admin", "primary"]);
var rsvpStatusEnum = pgEnum("rsvp_status", ["going", "maybe", "declined"]);
var needCategoryEnum = pgEnum("need_category", ["meals", "rides", "errands", "childcare", "household", "other"]);
var priorityEnum = pgEnum("priority", ["low", "normal", "urgent"]);
var needStatusEnum = pgEnum("need_status", ["open", "claimed", "completed", "cancelled"]);
var claimStatusEnum = pgEnum("claim_status", ["claimed", "completed", "released"]);
var updateTypeEnum = pgEnum("update_type", ["general", "gratitude", "memory", "milestone"]);
var digestFrequencyEnum = pgEnum("digest_frequency", ["immediate", "daily", "weekly"]);
var recipientTypeEnum = pgEnum("recipient_type", ["individual", "group", "all"]);
var mealSignupStatusEnum = pgEnum("meal_signup_status", ["pending", "confirmed", "completed", "cancelled"]);
var notificationTypeEnum = pgEnum("notification_type", [
  "need_created",
  "need_claimed",
  "need_unclaimed",
  "need_completed",
  "need_reminder",
  "event_created",
  "event_rsvp",
  "event_reminder",
  "meal_train_signup",
  "meal_train_cancelled",
  "new_message",
  "new_announcement",
  "new_update",
  "invite_sent",
  "personal_reminder"
]);
var notificationChannelEnum = pgEnum("notification_channel", ["email", "push"]);
var reminderTargetTypeEnum = pgEnum("reminder_target_type", ["need", "event", "personal"]);
var reminderStatusEnum = pgEnum("reminder_status", ["queued", "sent", "cancelled", "failed"]);
var memoryWallTypeEnum = pgEnum("memory_wall_type", ["memory", "story", "encouragement", "prayer", "picture"]);
var giftStatusEnum = pgEnum("gift_status", ["needed", "purchased", "received"]);
var eventTypeEnum = pgEnum("event_type", ["regular", "birthday", "anniversary", "milestone", "holiday"]);
var accessTierEnum = pgEnum("access_tier", ["community", "friend", "family"]);
var dashboardDisplayTypeEnum = pgEnum("dashboard_display_type", ["none", "photo", "slideshow", "quote", "memory"]);
var tourStatusEnum = pgEnum("tour_status", ["not_started", "in_progress", "completed", "dismissed"]);
var tourScopeEnum = pgEnum("tour_scope", ["household", "feature", "help"]);
var users = pgTable("users", {
  // Replit Auth: Using varchar for OpenID Connect sub claim
  id: varchar("id").primaryKey(),
  // Replit Auth fields
  email: varchar("email", { length: 320 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  // App-specific fields
  name: text("name"),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  householdId: integer("household_id"),
  status: userStatusEnum("status").default("pending").notNull(),
  accessTier: accessTierEnum("access_tier").default("community").notNull(),
  requestedTier: accessTierEnum("requested_tier"),
  tierRequestedAt: timestamp("tier_requested_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("users_household_idx").on(table.householdId),
  statusIdx: index("users_status_idx").on(table.status),
  emailIdx: index("users_email_idx").on(table.email)
}));
var households = pgTable("households", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique(),
  photoUrl: text("photo_url"),
  description: text("description"),
  primaryUserId: varchar("primary_user_id").notNull(),
  quietMode: boolean("quiet_mode").default(false).notNull(),
  timezone: varchar("timezone", { length: 64 }).default("America/Chicago").notNull(),
  delegateAdminApprovals: boolean("delegate_admin_approvals").default(false).notNull(),
  autoPromoteEnabled: boolean("auto_promote_enabled").default(false).notNull(),
  autoPromoteHours: integer("auto_promote_hours").default(48).notNull(),
  dashboardDisplayType: dashboardDisplayTypeEnum("dashboard_display_type").default("none").notNull(),
  dashboardPhotos: jsonb("dashboard_photos").$type().default([]),
  dashboardQuote: text("dashboard_quote"),
  dashboardQuoteAttribution: text("dashboard_quote_attribution"),
  dashboardFeaturedMemoryId: integer("dashboard_featured_memory_id"),
  showMemorialSubtitle: boolean("show_memorial_subtitle").default(false).notNull(),
  memorialName: varchar("memorial_name", { length: 255 }),
  memorialBirthDate: date("memorial_birth_date"),
  memorialPassingDate: date("memorial_passing_date"),
  customDashboardMessage: text("custom_dashboard_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  primaryUserIdx: index("households_primary_user_idx").on(table.primaryUserId),
  slugIdx: uniqueIndex("households_slug_idx").on(table.slug)
}));
var groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("groups_household_idx").on(table.householdId)
}));
var groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  groupUserIdx: uniqueIndex("group_members_group_user_idx").on(table.groupId, table.userId),
  userIdx: index("group_members_user_idx").on(table.userId)
}));
var invites = pgTable("invites", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  invitedEmail: varchar("invited_email", { length: 320 }),
  invitedPhone: varchar("invited_phone", { length: 20 }),
  invitedRole: invitedRoleEnum("invited_role").notNull(),
  inviterUserId: varchar("inviter_user_id").notNull(),
  status: inviteStatusEnum("status").default("sent").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull()
}, (table) => ({
  householdIdx: index("invites_household_idx").on(table.householdId),
  tokenIdx: index("invites_token_idx").on(table.token),
  statusIdx: index("invites_status_idx").on(table.status)
}));
var events = pgTable("events", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at"),
  location: varchar("location", { length: 500 }),
  createdBy: varchar("created_by").notNull(),
  googleCalendarEvtId: varchar("google_calendar_evt_id", { length: 255 }),
  eventType: eventTypeEnum("event_type").default("regular").notNull(),
  recurring: boolean("recurring").default(false).notNull(),
  associatedUserId: varchar("associated_user_id"),
  visibilityScope: visibilityScopeEnum("visibility_scope").default("all_supporters").notNull(),
  visibilityGroupIds: integer("visibility_group_ids").array(),
  customUserIds: jsonb("custom_user_ids").$type(),
  minRole: minRoleEnum("min_role"),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("events_household_idx").on(table.householdId),
  startAtIdx: index("events_start_at_idx").on(table.startAt),
  visibilityIdx: index("events_visibility_idx").on(table.visibilityScope),
  eventTypeIdx: index("events_event_type_idx").on(table.eventType)
}));
var eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: rsvpStatusEnum("status").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  eventUserIdx: uniqueIndex("event_rsvps_event_user_idx").on(table.eventId, table.userId),
  userIdx: index("event_rsvps_user_idx").on(table.userId)
}));
var needs = pgTable("needs", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  details: text("details"),
  category: needCategoryEnum("category").notNull(),
  priority: priorityEnum("priority").default("normal").notNull(),
  dueAt: timestamp("due_at"),
  recurrence: varchar("recurrence", { length: 255 }),
  createdBy: varchar("created_by").notNull(),
  visibilityScope: visibilityScopeEnum("visibility_scope").default("all_supporters").notNull(),
  visibilityGroupIds: integer("visibility_group_ids").array(),
  customUserIds: jsonb("custom_user_ids").$type(),
  status: needStatusEnum("status").default("open").notNull(),
  capacity: integer("capacity"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("needs_household_idx").on(table.householdId),
  statusIdx: index("needs_status_idx").on(table.status),
  categoryIdx: index("needs_category_idx").on(table.category),
  dueAtIdx: index("needs_due_at_idx").on(table.dueAt)
}));
var needClaims = pgTable("need_claims", {
  id: serial("id").primaryKey(),
  needId: integer("need_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: claimStatusEnum("status").default("claimed").notNull(),
  note: text("note"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  needIdx: index("need_claims_need_idx").on(table.needId),
  userIdx: index("need_claims_user_idx").on(table.userId),
  statusIdx: index("need_claims_status_idx").on(table.status)
}));
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  threadId: varchar("thread_id", { length: 64 }),
  senderUserId: varchar("sender_user_id").notNull(),
  body: text("body").notNull(),
  visibilityScope: visibilityScopeEnum("visibility_scope").default("all_supporters").notNull(),
  visibilityGroupIds: integer("visibility_group_ids").array(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("messages_household_idx").on(table.householdId),
  threadIdx: index("messages_thread_idx").on(table.threadId),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt)
}));
var announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  pinned: boolean("pinned").default(false).notNull(),
  createdBy: varchar("created_by").notNull(),
  visibilityScope: visibilityScopeEnum("visibility_scope").default("all_supporters").notNull(),
  visibilityGroupIds: integer("visibility_group_ids").array(),
  customUserIds: varchar("custom_user_ids").array(),
  mediaUrls: text("media_urls").array(),
  isQuestion: boolean("is_question").default(false).notNull(),
  questionContext: varchar("question_context", { length: 50 }),
  questionContextId: integer("question_context_id"),
  readBy: varchar("read_by").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("announcements_household_idx").on(table.householdId),
  pinnedIdx: index("announcements_pinned_idx").on(table.pinned),
  createdAtIdx: index("announcements_created_at_idx").on(table.createdAt),
  isQuestionIdx: index("announcements_is_question_idx").on(table.isQuestion)
}));
var questionReplies = pgTable("question_replies", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  householdId: integer("household_id").notNull(),
  authorId: varchar("author_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  questionIdx: index("question_replies_question_idx").on(table.questionId),
  householdIdx: index("question_replies_household_idx").on(table.householdId)
}));
var updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  authorId: varchar("author_id").notNull(),
  type: updateTypeEnum("type").default("general").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  photoUrls: jsonb("photo_urls").$type(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("updates_household_idx").on(table.householdId),
  authorIdx: index("updates_author_idx").on(table.authorId),
  createdAtIdx: index("updates_created_at_idx").on(table.createdAt)
}));
var notificationPrefs = pgTable("notification_prefs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  channelEmail: boolean("channel_email").default(true).notNull(),
  channelSms: boolean("channel_sms").default(false).notNull(),
  channelPush: boolean("channel_push").default(true).notNull(),
  digestFrequency: digestFrequencyEnum("digest_frequency").default("daily").notNull(),
  urgentNeedsAlerts: boolean("urgent_needs_alerts").default(true).notNull(),
  quietHours: jsonb("quiet_hours").$type(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  userIdx: index("notification_prefs_user_idx").on(table.userId)
}));
var adminMessages = pgTable("admin_messages", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  recipientType: recipientTypeEnum("recipient_type").notNull(),
  recipientGroupId: integer("recipient_group_id"),
  includedPrimary: boolean("included_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("admin_messages_household_idx").on(table.householdId),
  senderIdx: index("admin_messages_sender_idx").on(table.senderId)
}));
var adminMessageRecipients = pgTable("admin_message_recipients", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  userId: varchar("user_id").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  messageIdx: index("admin_message_recipients_message_idx").on(table.messageId),
  userIdx: index("admin_message_recipients_user_idx").on(table.userId)
}));
var adminGroups = pgTable("admin_groups", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("admin_groups_household_idx").on(table.householdId)
}));
var adminGroupMembers = pgTable("admin_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: varchar("user_id").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull()
}, (table) => ({
  groupIdx: index("admin_group_members_group_idx").on(table.groupId),
  userIdx: index("admin_group_members_user_idx").on(table.userId),
  groupUserIdx: uniqueIndex("admin_group_members_group_user_idx").on(table.groupId, table.userId)
}));
var auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  actorUserId: varchar("actor_user_id").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  targetType: varchar("target_type", { length: 64 }).notNull(),
  targetId: integer("target_id").notNull(),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("audit_logs_household_idx").on(table.householdId),
  actorIdx: index("audit_logs_actor_idx").on(table.actorUserId),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt)
}));
var mealTrains = pgTable("meal_trains", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  location: text("location"),
  peopleCount: integer("people_count"),
  favoriteMeals: text("favorite_meals"),
  allergies: text("allergies"),
  dislikes: text("dislikes"),
  specialInstructions: text("special_instructions"),
  dailyCapacity: integer("daily_capacity").default(1).notNull(),
  visibilityScope: visibilityScopeEnum("visibility_scope").default("all_supporters").notNull(),
  visibilityGroupIds: integer("visibility_group_ids").array(),
  customUserIds: jsonb("custom_user_ids").$type(),
  includeCommunityTier: boolean("include_community_tier").default(false).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  daysAheadOpen: integer("days_ahead_open").default(30),
  availabilityStartDate: date("availability_start_date"),
  availabilityEndDate: date("availability_end_date"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("meal_trains_household_idx").on(table.householdId)
}));
var mealSignups = pgTable("meal_signups", {
  id: serial("id").primaryKey(),
  mealTrainId: integer("meal_train_id").notNull(),
  userId: varchar("user_id").notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  status: mealSignupStatusEnum("status").default("confirmed").notNull(),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  mealTrainIdx: index("meal_signups_meal_train_idx").on(table.mealTrainId),
  userIdx: index("meal_signups_user_idx").on(table.userId),
  deliveryDateIdx: index("meal_signups_delivery_date_idx").on(table.deliveryDate)
}));
var mealTrainDays = pgTable("meal_train_days", {
  id: serial("id").primaryKey(),
  mealTrainId: integer("meal_train_id").notNull(),
  date: date("date").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  capacityOverride: integer("capacity_override"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  mealTrainDateIdx: uniqueIndex("meal_train_days_meal_train_date_idx").on(table.mealTrainId, table.date),
  mealTrainIdx: index("meal_train_days_meal_train_idx").on(table.mealTrainId),
  dateIdx: index("meal_train_days_date_idx").on(table.date)
}));
var notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  householdId: integer("household_id").notNull(),
  // Email preferences (opt-in by default - all false)
  emailEnabled: boolean("email_enabled").default(false).notNull(),
  emailNeedCreated: boolean("email_need_created").default(false).notNull(),
  emailNeedClaimed: boolean("email_need_claimed").default(false).notNull(),
  emailNeedUnclaimed: boolean("email_need_unclaimed").default(false).notNull(),
  emailNeedCompleted: boolean("email_need_completed").default(false).notNull(),
  emailNeedReminder: boolean("email_need_reminder").default(true).notNull(),
  emailEventCreated: boolean("email_event_created").default(false).notNull(),
  emailEventRsvp: boolean("email_event_rsvp").default(false).notNull(),
  emailEventReminder: boolean("email_event_reminder").default(true).notNull(),
  emailMealTrainSignup: boolean("email_meal_train_signup").default(false).notNull(),
  emailMealTrainCancelled: boolean("email_meal_train_cancelled").default(false).notNull(),
  emailNewMessage: boolean("email_new_message").default(false).notNull(),
  emailNewAnnouncement: boolean("email_new_announcement").default(false).notNull(),
  emailNewUpdate: boolean("email_new_update").default(false).notNull(),
  // Push preferences (opt-in by default - all false, no push for email-only system)
  pushEnabled: boolean("push_enabled").default(false).notNull(),
  pushNeedCreated: boolean("push_need_created").default(false).notNull(),
  pushNeedClaimed: boolean("push_need_claimed").default(false).notNull(),
  pushNeedUnclaimed: boolean("push_need_unclaimed").default(false).notNull(),
  pushNeedCompleted: boolean("push_need_completed").default(false).notNull(),
  pushNeedReminder: boolean("push_need_reminder").default(false).notNull(),
  pushEventCreated: boolean("push_event_created").default(false).notNull(),
  pushEventRsvp: boolean("push_event_rsvp").default(false).notNull(),
  pushEventReminder: boolean("push_event_reminder").default(false).notNull(),
  pushMealTrainSignup: boolean("push_meal_train_signup").default(false).notNull(),
  pushMealTrainCancelled: boolean("push_meal_train_cancelled").default(false).notNull(),
  pushNewMessage: boolean("push_new_message").default(false).notNull(),
  pushNewAnnouncement: boolean("push_new_announcement").default(false).notNull(),
  pushNewUpdate: boolean("push_new_update").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  userIdx: uniqueIndex("notification_preferences_user_idx").on(table.userId),
  householdIdx: index("notification_preferences_household_idx").on(table.householdId)
}));
var pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull()
}, (table) => ({
  userIdx: index("push_subscriptions_user_idx").on(table.userId),
  endpointIdx: uniqueIndex("push_subscriptions_endpoint_idx").on(table.endpoint)
}));
var notificationLogs = pgTable("notification_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  householdId: integer("household_id").notNull(),
  notificationType: notificationTypeEnum("notification_type").notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  metadata: jsonb("metadata"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  delivered: boolean("delivered").default(false).notNull(),
  deliveredAt: timestamp("delivered_at"),
  error: text("error")
}, (table) => ({
  userIdx: index("notification_logs_user_idx").on(table.userId),
  householdIdx: index("notification_logs_household_idx").on(table.householdId),
  sentAtIdx: index("notification_logs_sent_at_idx").on(table.sentAt),
  typeIdx: index("notification_logs_type_idx").on(table.notificationType)
}));
var reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  householdId: integer("household_id").notNull(),
  targetType: reminderTargetTypeEnum("target_type").notNull(),
  targetId: integer("target_id"),
  // Nullable for personal reminders
  reminderOffsetMinutes: integer("reminder_offset_minutes"),
  // Nullable for personal reminders
  triggerAt: timestamp("trigger_at").notNull(),
  title: text("title"),
  // For personal reminders
  description: text("description"),
  // For personal reminders
  status: reminderStatusEnum("status").default("queued").notNull(),
  sentAt: timestamp("sent_at"),
  retryAt: timestamp("retry_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  userIdx: index("reminders_user_idx").on(table.userId),
  householdIdx: index("reminders_household_idx").on(table.householdId),
  targetIdx: index("reminders_target_idx").on(table.targetType, table.targetId),
  statusTriggerIdx: index("reminders_status_trigger_idx").on(table.status, table.triggerAt)
}));
var memoryWall = pgTable("memory_wall", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  authorId: varchar("author_id").notNull(),
  type: memoryWallTypeEnum("type").notNull(),
  content: text("content"),
  // Text content for memory, story, encouragement, prayer
  imageUrl: text("image_url"),
  // For pictures
  imageUrls: jsonb("image_urls").$type(),
  // Multiple images support
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("memory_wall_household_idx").on(table.householdId),
  typeIdx: index("memory_wall_type_idx").on(table.type),
  createdAtIdx: index("memory_wall_created_at_idx").on(table.createdAt)
}));
var memoryWallPositions = pgTable("memory_wall_positions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  householdId: integer("household_id").notNull(),
  memoryId: integer("memory_id").notNull(),
  x: integer("x").notNull(),
  // X position in pixels
  y: integer("y").notNull(),
  // Y position in pixels
  rotation: real("rotation").default(0).notNull(),
  // Rotation angle in degrees
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  userMemoryIdx: uniqueIndex("memory_wall_positions_user_memory_idx").on(table.userId, table.householdId, table.memoryId),
  householdIdx: index("memory_wall_positions_household_idx").on(table.householdId)
}));
var giftRegistry = pgTable("gift_registry", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  url: text("url"),
  // Link to product page
  imageUrl: text("image_url"),
  price: varchar("price", { length: 100 }),
  // Store as string to handle various currencies/formats
  priority: priorityEnum("priority").default("normal").notNull(),
  status: giftStatusEnum("status").default("needed").notNull(),
  purchasedBy: varchar("purchased_by"),
  // User ID who purchased
  purchasedAt: timestamp("purchased_at"),
  notes: text("notes"),
  // Special instructions
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("gift_registry_household_idx").on(table.householdId),
  statusIdx: index("gift_registry_status_idx").on(table.status),
  priorityIdx: index("gift_registry_priority_idx").on(table.priority)
}));
var onboardingTours = pgTable("onboarding_tours", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  // e.g., "household.setup.v1", "needs.board.admin.v1"
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  scope: tourScopeEnum("scope").notNull(),
  // household, feature, help
  roleAccess: jsonb("role_access").$type().default(["admin", "primary", "supporter"]).notNull(),
  // Which roles can see this tour
  version: integer("version").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  slugIdx: index("onboarding_tours_slug_idx").on(table.slug),
  scopeIdx: index("onboarding_tours_scope_idx").on(table.scope)
}));
var userTourProgress = pgTable("user_tour_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  householdId: integer("household_id").notNull(),
  tourId: integer("tour_id").notNull(),
  status: tourStatusEnum("status").default("not_started").notNull(),
  lastStep: integer("last_step").default(0),
  completedAt: timestamp("completed_at"),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  userTourIdx: uniqueIndex("user_tour_progress_user_tour_idx").on(table.userId, table.householdId, table.tourId),
  statusIdx: index("user_tour_progress_status_idx").on(table.status)
}));

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.REPLIT_DEPLOYMENT === "1" || process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var { Pool } = pg;
var _db = null;
var _pool = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        // Connection pool configuration
        max: 20,
        // Maximum number of clients in the pool
        idleTimeoutMillis: 3e4,
        // Close idle clients after 30 seconds
        connectionTimeoutMillis: 1e4
        // Timeout after 10 seconds if can't connect
      });
      _pool.on("error", (err, client2) => {
        console.error(
          "[Database] Pool error - connection terminated:",
          err.message
        );
        if (err.message.includes("terminating connection")) {
          console.warn(
            "[Database] Connection terminated by administrator, will reconnect automatically on next query"
          );
        }
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.id) {
    throw new Error("User id is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      id: user.id
    };
    const updateSet = {};
    const textFields = ["name", "email", "phone", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    let finalRole;
    if (user.role !== void 0) {
      finalRole = user.role;
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.id === ENV.ownerId) {
      finalRole = "admin";
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (finalRole && user.accessTier === void 0) {
      const alignedTier = getAccessTierForRole(finalRole);
      values.accessTier = alignedTier;
      updateSet.accessTier = alignedTier;
    } else if (user.accessTier !== void 0 && finalRole !== void 0) {
      if ((finalRole === "primary" || finalRole === "admin") && user.accessTier !== "family") {
        console.error(
          `[upsertUser] REJECTED: Attempted to set ${finalRole} role with ${user.accessTier} tier. Primary/Admin MUST have family tier.`
        );
        throw new Error(
          `Invalid role/tier combination: ${finalRole} role requires family tier, got ${user.accessTier}`
        );
      }
      values.accessTier = user.accessTier;
      updateSet.accessTier = user.accessTier;
    } else if (user.accessTier !== void 0) {
      const existingUser = await getUser(user.id);
      if (existingUser) {
        if ((existingUser.role === "primary" || existingUser.role === "admin") && user.accessTier !== "family") {
          console.error(
            `[upsertUser] REJECTED: Attempted tier-only update to ${user.accessTier} for ${existingUser.role} user ${user.id}. Primary/Admin MUST remain at family tier.`
          );
          throw new Error(
            `Cannot downgrade ${existingUser.role} user to ${user.accessTier} tier. Primary/Admin users require family tier.`
          );
        }
        values.accessTier = user.accessTier;
        updateSet.accessTier = sql`CASE 
          WHEN ${users.role} IN ('primary', 'admin') THEN 'family'::varchar 
          ELSE ${user.accessTier}::varchar 
        END`;
      } else {
        console.error(
          `[upsertUser] REJECTED: Attempted to create new user ${user.id} with tier but no role`
        );
        throw new Error(
          `Cannot create new user with access tier but no role. Role is required for new users.`
        );
      }
    }
    if (user.householdId !== void 0) {
      values.householdId = user.householdId;
      updateSet.householdId = user.householdId;
    }
    if (user.status !== void 0) {
      values.status = user.status;
      updateSet.status = user.status;
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.id,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUser(id) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUsersByHousehold(householdId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.householdId, householdId));
}
async function updateUserStatus(userId, status) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ status }).where(eq(users.id, userId));
}
async function updateUserRole(userId, role) {
  const db = await getDb();
  if (!db) return;
  const accessTier = getAccessTierForRole(role);
  await db.update(users).set({
    role,
    accessTier,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
}
async function updateUserProfile(userId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}
async function removeUserFromHousehold(userId, householdId) {
  const db = await getDb();
  if (!db) return;
  const targetUser = await getUserById(userId);
  if (!targetUser) {
    throw new Error("User not found");
  }
  if (targetUser.householdId !== householdId) {
    throw new Error("User does not belong to this household");
  }
  const userGroups = await getUserGroups(userId, householdId);
  for (const group of userGroups) {
    await removeUserFromGroup(group.id, userId);
  }
  await db.update(users).set({
    householdId: null,
    status: "blocked"
  }).where(eq(users.id, userId));
}
async function getUsersPendingTierApproval(householdId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(users).where(
    and(
      eq(users.householdId, householdId),
      sql`${users.requestedTier} IS NOT NULL`,
      sql`${users.requestedTier} != ${users.accessTier}`
    )
  );
  return result;
}
async function updateUserAccessTier(userId, tier) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    accessTier: sql`CASE 
      WHEN role IN ('primary', 'admin') THEN 'family'::varchar 
      ELSE ${tier}::varchar 
    END`,
    requestedTier: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
  const user = await getUserById(userId);
  if (user && (user.role === "primary" || user.role === "admin") && tier !== "family") {
    console.warn(
      `[updateUserAccessTier] Enforced family tier for ${user.role} user ${userId} (requested: ${tier})`
    );
  }
}
function getAccessTierForRole(role) {
  if (role === "primary" || role === "admin") {
    return "family";
  }
  return "community";
}
async function joinHouseholdWithTier(userId, householdId, requestedTier) {
  const db = await getDb();
  if (!db) return;
  const initialTier = "community";
  await db.update(users).set({
    householdId,
    accessTier: initialTier,
    requestedTier,
    tierRequestedAt: /* @__PURE__ */ new Date(),
    role: "supporter",
    status: "active",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
}
async function createHousehold(household) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!household.slug) {
    household.slug = await generateUniqueSlug(household.name);
  }
  const result = await db.insert(households).values(household).returning({ id: households.id });
  return result[0].id;
}
async function getHousehold(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(households).where(eq(households.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateHousehold(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(households).set(data).where(eq(households.id, id));
}
async function updateHouseholdAutoPromote(householdId, settings) {
  const db = await getDb();
  if (!db) return;
  await db.update(households).set({
    ...settings,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(households.id, householdId));
}
function generateSlug(name) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let slug = normalized.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!slug || slug.length === 0) {
    slug = "family";
  }
  return slug;
}
async function searchHouseholds(query) {
  const db = await getDb();
  if (!db) return [];
  const searchPattern = `%${query}%`;
  const result = await db.select().from(households).where(ilike(households.name, searchPattern)).limit(20).orderBy(households.name);
  return result;
}
async function getHouseholdBySlug(slug) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(households).where(eq(households.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function isSlugAvailable(slug, excludeHouseholdId) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available - cannot check slug availability");
  }
  const conditions = excludeHouseholdId ? and(
    eq(households.slug, slug),
    sql`${households.id} != ${excludeHouseholdId}`
  ) : eq(households.slug, slug);
  const result = await db.select({ id: households.id }).from(households).where(conditions).limit(1);
  return result.length === 0;
}
async function generateUniqueSlug(baseName, excludeHouseholdId) {
  const MAX_SLUG_LENGTH = 250;
  let baseSlug = generateSlug(baseName);
  if (baseSlug.length > MAX_SLUG_LENGTH) {
    baseSlug = baseSlug.substring(0, MAX_SLUG_LENGTH);
  }
  let slug = baseSlug;
  let counter = 1;
  while (!await isSlugAvailable(slug, excludeHouseholdId)) {
    slug = `${baseSlug}${counter}`;
    counter++;
    if (counter > 1e4) {
      throw new Error(
        `Unable to generate unique slug for "${baseName}" after 10000 attempts`
      );
    }
  }
  return slug;
}
async function createGroup(group) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(groups).values(group).returning({ id: groups.id });
  return result[0].id;
}
async function getGroupsByHousehold(householdId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: groups.id,
    householdId: groups.householdId,
    name: groups.name,
    description: groups.description,
    createdAt: groups.createdAt,
    memberCount: sql`count(${groupMembers.userId})::int`
  }).from(groups).leftJoin(groupMembers, eq(groups.id, groupMembers.groupId)).where(eq(groups.householdId, householdId)).groupBy(groups.id);
  return result;
}
async function addUserToGroup(groupId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(groupMembers).values({ groupId, userId });
}
async function removeUserFromGroup(groupId, userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(groupMembers).where(
    and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))
  );
}
async function getUserGroups(userId, householdId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ group: groups }).from(groupMembers).innerJoin(groups, eq(groupMembers.groupId, groups.id)).where(
    and(eq(groupMembers.userId, userId), eq(groups.householdId, householdId))
  );
  return result.map((r) => r.group);
}
async function updateGroup(groupId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(groups).set(data).where(eq(groups.id, groupId));
}
async function deleteGroup(groupId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
  await db.delete(groups).where(eq(groups.id, groupId));
}
async function getGroupMembers(groupId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ user: users }).from(groupMembers).innerJoin(users, eq(groupMembers.userId, users.id)).where(eq(groupMembers.groupId, groupId));
  return result.map((r) => r.user);
}
async function createInvite(invite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invites).values(invite).returning({ id: invites.id });
  return result[0].id;
}
async function getInviteByToken(token) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(invites).where(eq(invites.token, token)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateInviteStatus(id, status) {
  const db = await getDb();
  if (!db) return;
  await db.update(invites).set({ status }).where(eq(invites.id, id));
}
async function getPendingInvitesByHousehold(householdId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(invites).where(
    and(eq(invites.householdId, householdId), eq(invites.status, "sent"))
  );
}
async function getInviteById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(invites).where(eq(invites.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateInvite(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(invites).set(data).where(eq(invites.id, id));
}
async function createEvent(event) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(events).values(event).returning({ id: events.id });
  return result[0].id;
}
async function getEventsByHousehold(householdId, userId) {
  const db = await getDb();
  if (!db) return [];
  const eventsWithRsvps = await db.select({
    event: events,
    rsvp: eventRsvps
  }).from(events).leftJoin(eventRsvps, eq(events.id, eventRsvps.eventId)).where(eq(events.householdId, householdId));
  const eventsMap = /* @__PURE__ */ new Map();
  for (const row of eventsWithRsvps) {
    const eventId = row.event.id;
    if (!eventsMap.has(eventId)) {
      eventsMap.set(eventId, {
        ...row.event,
        goingCount: 0,
        userRsvpStatus: null
      });
    }
    if (row.rsvp?.status === "going") {
      eventsMap.get(eventId).goingCount++;
    }
    if (userId && row.rsvp?.userId === userId) {
      eventsMap.get(eventId).userRsvpStatus = row.rsvp.status;
    }
  }
  return Array.from(eventsMap.values());
}
async function getEvent(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateEvent(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(events).set(data).where(eq(events.id, id));
}
async function deleteEvent(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(events).where(eq(events.id, id));
}
async function createNeed(need) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(needs).values(need).returning({ id: needs.id });
  return result[0].id;
}
async function getNeedsByHousehold(householdId) {
  const db = await getDb();
  if (!db) return [];
  const needsWithClaims = await db.select({
    need: needs,
    claim: needClaims,
    claimer: users
  }).from(needs).leftJoin(needClaims, eq(needs.id, needClaims.needId)).leftJoin(users, eq(needClaims.userId, users.id)).where(eq(needs.householdId, householdId));
  const needsMap = /* @__PURE__ */ new Map();
  for (const row of needsWithClaims) {
    const needId = row.need.id;
    if (!needsMap.has(needId)) {
      needsMap.set(needId, {
        ...row.need,
        claimedByName: row.claimer?.name || null,
        claimedByUserId: row.claimer?.id || null,
        claimCount: 0,
        claims: []
        // Store all claims for this need
      });
    }
    if (row.claim) {
      needsMap.get(needId).claimCount++;
      needsMap.get(needId).claims.push({
        id: row.claim.id,
        userId: row.claim.userId,
        status: row.claim.status,
        note: row.claim.note,
        createdAt: row.claim.createdAt
      });
      if (!needsMap.get(needId).claimedByName && row.claimer) {
        needsMap.get(needId).claimedByName = row.claimer.name;
        needsMap.get(needId).claimedByUserId = row.claimer.id;
      }
    }
  }
  const allNeeds = Array.from(needsMap.values());
  return allNeeds.sort((a, b) => {
    if (a.completedAt && b.completedAt) {
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    }
    return 0;
  });
}
async function getNeed(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(needs).where(eq(needs.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateNeed(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(needs).set(data).where(eq(needs.id, id));
}
async function deleteNeed(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(needs).where(eq(needs.id, id));
}
async function createNeedClaim(claim) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(needClaims).values(claim).returning({ id: needClaims.id });
  return result[0].id;
}
async function getClaimsByNeed(needId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(needClaims).where(eq(needClaims.needId, needId));
}
async function getNeedClaim(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(needClaims).where(eq(needClaims.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateNeedClaim(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(needClaims).set(data).where(eq(needClaims.id, id));
}
async function createAnnouncement(announcement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(announcements).values(announcement).returning({ id: announcements.id });
  return result[0].id;
}
async function getAnnouncementsByHousehold(householdId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(announcements).where(eq(announcements.householdId, householdId));
}
async function updateAnnouncement(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(announcements).set(data).where(eq(announcements.id, id));
}
async function deleteAnnouncement(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(announcements).where(eq(announcements.id, id));
}
async function getQuestionsByHousehold(householdId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(announcements).where(
    and(
      eq(announcements.householdId, householdId),
      eq(announcements.isQuestion, true)
    )
  ).orderBy(desc(announcements.createdAt));
}
async function markQuestionAsRead(questionId, userId) {
  const db = await getDb();
  if (!db) return;
  const question = await db.select().from(announcements).where(eq(announcements.id, questionId)).limit(1);
  if (question.length === 0) return;
  const readBy = question[0].readBy || [];
  if (!readBy.includes(userId)) {
    await db.update(announcements).set({ readBy: [...readBy, userId] }).where(eq(announcements.id, questionId));
  }
}
async function getUnreadQuestionCount(householdId, userId) {
  const db = await getDb();
  if (!db) return 0;
  const questions = await db.select().from(announcements).where(
    and(
      eq(announcements.householdId, householdId),
      eq(announcements.isQuestion, true)
    )
  );
  return questions.filter((q) => !q.readBy?.includes(userId)).length;
}
async function createQuestionReply(reply) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(questionReplies).values(reply).returning({ id: questionReplies.id });
  return result[0].id;
}
async function getQuestionReplies(questionId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(questionReplies).where(eq(questionReplies.questionId, questionId)).orderBy(questionReplies.createdAt);
}
async function createAuditLog(log) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to create audit log:", error);
  }
}
async function getNotificationPrefs(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function upsertNotificationPrefs(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(notificationPrefs).set(data).where(eq(notificationPrefs.userId, userId));
  } else {
    await db.insert(notificationPrefs).values({ userId, ...data });
  }
}
async function upsertRsvp(rsvp) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(eventRsvps).where(
    and(
      eq(eventRsvps.eventId, rsvp.eventId),
      eq(eventRsvps.userId, rsvp.userId)
    )
  ).limit(1);
  if (existing.length > 0) {
    await db.update(eventRsvps).set({ status: rsvp.status }).where(eq(eventRsvps.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(eventRsvps).values(rsvp).returning({ id: eventRsvps.id });
    return result[0].id;
  }
}
async function getRsvpsByEvent(eventId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    rsvp: eventRsvps,
    user: users
  }).from(eventRsvps).innerJoin(users, eq(eventRsvps.userId, users.id)).where(eq(eventRsvps.eventId, eventId));
}
async function getRecentActivity(householdId, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const logs = await db.select({
    log: auditLogs,
    actor: users
  }).from(auditLogs).leftJoin(users, eq(auditLogs.actorUserId, users.id)).where(eq(auditLogs.householdId, householdId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
  return logs.map((row) => ({
    id: row.log.id,
    action: row.log.action,
    actorName: row.actor?.name || null,
    createdAt: row.log.createdAt,
    metadata: row.log.metadata
  }));
}
async function createAdminMessage(message) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(adminMessages).values(message).returning({ id: adminMessages.id });
  return result[0].id;
}
async function createAdminMessageRecipient(recipient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(adminMessageRecipients).values(recipient);
}
async function getAdminMessagesByHousehold(householdId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(adminMessages).where(eq(adminMessages.householdId, householdId)).orderBy(desc(adminMessages.createdAt));
}
async function createAdminGroup(group) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(adminGroups).values(group).returning({ id: adminGroups.id });
  return result[0].id;
}
async function addAdminGroupMember(member) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(adminGroupMembers).values(member);
}
async function getAdminGroupsByHousehold(householdId) {
  const db = await getDb();
  if (!db) return [];
  const groups2 = await db.select({
    group: adminGroups
  }).from(adminGroups).where(eq(adminGroups.householdId, householdId)).orderBy(desc(adminGroups.createdAt));
  const result = [];
  for (const { group } of groups2) {
    const members = await db.select().from(adminGroupMembers).where(eq(adminGroupMembers.groupId, group.id));
    result.push({
      ...group,
      memberCount: members.length
    });
  }
  return result;
}
async function getAdminGroup(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(adminGroups).where(eq(adminGroups.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAdminGroupMembers(groupId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(adminGroupMembers).where(eq(adminGroupMembers.groupId, groupId));
}
async function deleteAdminGroup(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(adminGroupMembers).where(eq(adminGroupMembers.groupId, id));
  await db.delete(adminGroups).where(eq(adminGroups.id, id));
}
async function createUpdate(update) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(updates).values(update).returning({ id: updates.id });
  return result[0].id;
}
async function getUpdatesByHousehold(householdId) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({
    update: updates,
    author: users
  }).from(updates).leftJoin(users, eq(updates.authorId, users.id)).where(eq(updates.householdId, householdId)).orderBy(desc(updates.createdAt));
  return results.map(({ update, author }) => ({
    ...update,
    authorName: author?.name || author?.email || "Unknown"
  }));
}
async function getUpdate(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(updates).where(eq(updates.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function deleteUpdate(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(updates).where(eq(updates.id, id));
}
async function getMealTrainByHousehold(householdId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(mealTrains).where(eq(mealTrains.householdId, householdId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createMealTrain(mealTrain) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(mealTrains).values(mealTrain).returning({ id: mealTrains.id });
  return result[0].id;
}
async function updateMealTrain(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(mealTrains).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(mealTrains.id, id));
}
async function getMealSignupsByMealTrain(mealTrainId) {
  const db = await getDb();
  if (!db) return [];
  const signups = await db.select().from(mealSignups).where(eq(mealSignups.mealTrainId, mealTrainId)).orderBy(mealSignups.deliveryDate);
  const userIds = signups.map((s) => s.userId).filter((id) => id != null);
  const signupUsers = userIds.length > 0 ? await db.select().from(users).where(inArray(users.id, userIds)) : [];
  return signups.map((signup) => {
    const user = signupUsers.find((u) => u.id === signup.userId);
    return {
      ...signup,
      userName: user?.name || user?.email || "Unknown",
      userEmail: user?.email || ""
    };
  });
}
async function createMealSignup(signup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(mealSignups).values(signup).returning({ id: mealSignups.id });
  return result[0].id;
}
async function getMealSignup(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(mealSignups).where(eq(mealSignups.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateMealSignup(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(mealSignups).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(mealSignups.id, id));
}
async function deleteMealSignup(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(mealSignups).where(eq(mealSignups.id, id));
}
async function saveMealTrainDays(mealTrainId, dates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(mealTrainDays).where(eq(mealTrainDays.mealTrainId, mealTrainId));
  if (dates.length > 0) {
    await db.insert(mealTrainDays).values(
      dates.map((date2) => ({
        mealTrainId,
        date: date2.toISOString().split("T")[0],
        isAvailable: true
      }))
    );
  }
}
async function getMealTrainDays(mealTrainId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mealTrainDays).where(eq(mealTrainDays.mealTrainId, mealTrainId)).orderBy(mealTrainDays.date);
}
async function isMealDayAvailable(mealTrainId, date2) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(mealTrainDays).where(
    and(
      eq(mealTrainDays.mealTrainId, mealTrainId),
      eq(mealTrainDays.date, date2),
      eq(mealTrainDays.isAvailable, true)
    )
  ).limit(1);
  return result.length > 0;
}
async function createMemoryWallEntry(entry) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(memoryWall).values(entry).returning();
  return result[0].id;
}
async function getMemoryWallEntries(householdId, type) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(memoryWall.householdId, householdId)];
  if (type) {
    conditions.push(eq(memoryWall.type, type));
  }
  return await db.select({
    id: memoryWall.id,
    householdId: memoryWall.householdId,
    authorId: memoryWall.authorId,
    type: memoryWall.type,
    content: memoryWall.content,
    imageUrl: memoryWall.imageUrl,
    imageUrls: memoryWall.imageUrls,
    createdAt: memoryWall.createdAt,
    updatedAt: memoryWall.updatedAt,
    authorName: users.name
  }).from(memoryWall).leftJoin(users, eq(memoryWall.authorId, users.id)).where(and(...conditions)).orderBy(desc(memoryWall.createdAt));
}
async function getMemoryWallEntry(entryId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(memoryWall).where(eq(memoryWall.id, entryId)).limit(1);
  return result[0] || null;
}
async function deleteMemoryWallEntry(entryId) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  await db.delete(memoryWall).where(eq(memoryWall.id, entryId));
}
async function updateMemoryWallEntry(entryId, updates2) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const updateData = { updatedAt: /* @__PURE__ */ new Date() };
  if (updates2.type !== void 0) updateData.type = updates2.type;
  if (updates2.content !== void 0) updateData.content = updates2.content;
  if (updates2.imageUrl !== void 0) updateData.imageUrl = updates2.imageUrl;
  if (updates2.imageUrls !== void 0) updateData.imageUrls = updates2.imageUrls;
  await db.update(memoryWall).set(updateData).where(eq(memoryWall.id, entryId));
}
async function getMemoryWallPositions(userId, householdId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(memoryWallPositions).where(
    and(
      eq(memoryWallPositions.userId, userId),
      eq(memoryWallPositions.householdId, householdId)
    )
  );
}
async function saveMemoryWallPosition(position) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const existing = await db.select().from(memoryWallPositions).where(
    and(
      eq(memoryWallPositions.userId, position.userId),
      eq(memoryWallPositions.householdId, position.householdId),
      eq(memoryWallPositions.memoryId, position.memoryId)
    )
  ).limit(1);
  if (existing.length > 0) {
    await db.update(memoryWallPositions).set({
      x: position.x,
      y: position.y,
      rotation: position.rotation,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(memoryWallPositions.id, existing[0].id));
  } else {
    await db.insert(memoryWallPositions).values(position);
  }
}
async function createGiftRegistryItem(item) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(giftRegistry).values(item).returning();
  return result[0].id;
}
async function getGiftRegistryItems(householdId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: giftRegistry.id,
    householdId: giftRegistry.householdId,
    name: giftRegistry.name,
    description: giftRegistry.description,
    url: giftRegistry.url,
    imageUrl: giftRegistry.imageUrl,
    price: giftRegistry.price,
    priority: giftRegistry.priority,
    status: giftRegistry.status,
    purchasedBy: giftRegistry.purchasedBy,
    purchasedAt: giftRegistry.purchasedAt,
    notes: giftRegistry.notes,
    createdAt: giftRegistry.createdAt,
    updatedAt: giftRegistry.updatedAt,
    purchaserName: users.name
  }).from(giftRegistry).leftJoin(users, eq(giftRegistry.purchasedBy, users.id)).where(eq(giftRegistry.householdId, householdId)).orderBy(
    desc(
      sql`CASE WHEN ${giftRegistry.priority} = 'urgent' THEN 1 WHEN ${giftRegistry.priority} = 'normal' THEN 2 ELSE 3 END`
    ),
    giftRegistry.createdAt
  );
}
async function getGiftRegistryItem(itemId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(giftRegistry).where(eq(giftRegistry.id, itemId)).limit(1);
  return result[0] || null;
}
async function updateGiftRegistryItem(itemId, updates2) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates2).filter(([_, v]) => v !== void 0)
  );
  await db.update(giftRegistry).set({ ...cleanUpdates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(giftRegistry.id, itemId));
}
async function markGiftPurchased(itemId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  await db.update(giftRegistry).set({
    status: "purchased",
    purchasedBy: userId,
    purchasedAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(giftRegistry.id, itemId));
}
async function markGiftReceived(itemId) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  await db.update(giftRegistry).set({
    status: "received",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(giftRegistry.id, itemId));
}
async function deleteGiftRegistryItem(itemId) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  await db.delete(giftRegistry).where(eq(giftRegistry.id, itemId));
}

// server/replitAuth.ts
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  const isProduction = process.env.NODE_ENV === "production";
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertReplitUser(claims) {
  const userData = {
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    // Combine first and last name for the name field
    name: [claims["first_name"], claims["last_name"]].filter(Boolean).join(" ") || null,
    lastSignedIn: /* @__PURE__ */ new Date()
  };
  await upsertUser(userData);
}
async function setupAuth(app) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertReplitUser(tokens.claims());
    verified(null, user);
  };
  const getDomainForHost = (hostname) => {
    const domains = process.env.REPLIT_DOMAINS.split(",");
    if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
      return domains[0];
    }
    for (const domain of domains) {
      if (hostname.endsWith(domain)) {
        return domain;
      }
    }
    return domains[0];
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app.get("/api/login", (req, res, next) => {
    if (req.query.redirect && typeof req.query.redirect === "string") {
      const redirect = req.query.redirect;
      if (redirect.startsWith("/") && !redirect.includes("//")) {
        req.session.returnTo = redirect;
      }
    }
    const domain = getDomainForHost(req.hostname);
    passport.authenticate(`replitauth:${domain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app.get("/api/callback", (req, res, next) => {
    const domain = getDomainForHost(req.hostname);
    passport.authenticate(`replitauth:${domain}`, {
      failureRedirect: "/api/login"
    })(req, res, (err) => {
      if (err) {
        return next(err);
      }
      const redirectTo = req.session.returnTo || "/";
      delete req.session.returnTo;
      res.redirect(redirectTo);
    });
  });
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/testAuth.ts
async function setupTestAuth(app) {
  if (process.env.NODE_ENV === "production") {
    console.log("Test auth endpoints disabled in production");
    return;
  }
  console.log("\u26A0\uFE0F  Test auth endpoints enabled (development only)");
  app.post("/api/test/login", async (req, res) => {
    try {
      const {
        userId = "test-user-123",
        email = "test@example.com",
        firstName = "Test",
        lastName = "User",
        role = "admin"
      } = req.body || {};
      const userData = {
        id: userId,
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        profileImageUrl: null,
        lastSignedIn: /* @__PURE__ */ new Date()
      };
      await upsertUser(userData);
      const user = await getUser(userId);
      if (!user) {
        return res.status(500).json({ error: "Failed to create test user" });
      }
      const sessionUser = {
        claims: {
          sub: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          exp: Math.floor(Date.now() / 1e3) + 7 * 24 * 60 * 60
          // 1 week
        },
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expires_at: Math.floor(Date.now() / 1e3) + 7 * 24 * 60 * 60
      };
      req.login(sessionUser, (err) => {
        if (err) {
          console.error("Test login error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        res.json({
          success: true,
          user: {
            id: userId,
            email,
            firstName,
            lastName,
            role
          }
        });
      });
    } catch (error) {
      console.error("Test auth error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.post("/api/test/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
  app.get("/api/test/session", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user;
      res.json({
        authenticated: true,
        user: {
          id: user.claims?.sub,
          email: user.claims?.email,
          firstName: user.claims?.first_name,
          lastName: user.claims?.last_name
        }
      });
    } else {
      res.json({ authenticated: false });
    }
  });
}

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/routers.ts
import { TRPCError as TRPCError16 } from "@trpc/server";
import { z as z15 } from "zod";
import crypto2 from "crypto";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  if (ctx.user.status === "blocked") {
    throw new TRPCError2({
      code: "FORBIDDEN",
      message: "Your access has been blocked. Please contact the household administrator."
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = protectedProcedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/inviteRouter.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages: messages3,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages3.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/inviteRouter.ts
import crypto from "crypto";
import { Resend } from "resend";
var resend = new Resend(process.env.RESEND_API_KEY);
var FROM_EMAIL = "Our Brother's Keeper <notifications@obkapp.com>";
function escapeHtml(text2) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text2.replace(/[&<>"']/g, (char) => map[char]);
}
function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}
async function sendInviteNotification(email, phone, householdSlug, householdName, inviterName, options) {
  const baseUrl = process.env.VITE_APP_URL || "https://obkapp.com";
  let inviteLink;
  if (options?.token) {
    inviteLink = `${baseUrl}/accept-invite?token=${options.token}`;
  } else if (householdSlug) {
    inviteLink = `${baseUrl}/${householdSlug}`;
  } else {
    return { success: false, error: "Neither token nor household slug provided" };
  }
  if (email) {
    try {
      const safeInviterName = escapeHtml(inviterName);
      const safeHouseholdName = escapeHtml(householdName);
      const safeRecipientName = options?.recipientName ? escapeHtml(options.recipientName) : "";
      let greeting;
      let mainMessage;
      let buttonText;
      let subject;
      let footerNote;
      if (options?.isPrimary) {
        greeting = safeRecipientName ? `Hi ${safeRecipientName},` : "Hi there,";
        mainMessage = `<p><strong>${safeInviterName}</strong> has set up a support page for <strong>${safeHouseholdName}</strong> on Our Brother's Keeper.</p>
              <p>You've been invited to become the <strong>Primary Administrator</strong> of this support circle. As the primary administrator, you'll have full control over settings, supporters, and all aspects of the support page.</p>`;
        buttonText = "Accept Invitation";
        subject = `You're Invited to Manage ${safeHouseholdName}'s Support Circle`;
        footerNote = '<p style="font-size: 12px; color: #999;">This invitation will expire in 14 days.</p>';
      } else {
        greeting = "Hi there,";
        mainMessage = `<p><strong>${safeInviterName}</strong> has invited you to join <strong>${safeHouseholdName}'s</strong> support circle on Our Brother's Keeper.</p>`;
        buttonText = "Join Support Circle";
        subject = `\u{1F48C} You're Invited to Support ${safeHouseholdName}`;
        footerNote = `<p style="font-size: 12px; color: #999;">If you don't want to join, you can simply ignore this email.</p>`;
      }
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6BC4B8 0%, #5A9FD4 50%, #9B7FB8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #6BC4B8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>\u{1F90D} Our Brother's Keeper</h1>
            </div>
            <div class="content">
              <p>${greeting}</p>
              ${mainMessage}
              <div style="background: #f9fafb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; font-size: 16px;">Our Brother's Keeper is a compassionate platform designed to help families coordinate support during difficult times.</p>
              </div>
              <p>Click the button below to ${options?.isPrimary ? "accept this invitation and take control of your support circle" : "join this caring community and see how you can help"}.</p>
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">${buttonText}</a>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">With care and support,<br>The Our Brother's Keeper Team</p>
            </div>
            <div class="footer">
              <p>You're receiving this email because ${safeInviterName} ${options?.isPrimary ? `has invited you to manage ${safeHouseholdName}'s support page` : `invited you to support ${safeHouseholdName}`}.</p>
              ${footerNote}
            </div>
          </div>
        </body>
        </html>
      `;
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject,
        html: emailHtml
      });
      if (result.error) {
        console.error("[Invite] Email send failed:", result.error);
        return {
          success: false,
          error: `Failed to send invite email: ${result.error.message}`,
          inviteLink
        };
      }
      console.log(`[Invite] Email sent successfully to ${email}: ${inviteLink}`, result.data);
      return { success: true, inviteLink };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[Invite] Error sending email:", error);
      return {
        success: false,
        error: `Email sending failed: ${errorMessage}`,
        inviteLink
      };
    }
  }
  if (phone) {
    console.log(`[Invite] SMS not yet implemented for ${phone}: ${inviteLink}`);
  }
  return { success: true, inviteLink };
}
var inviteRouter = router({
  // Create a new invite with AI-powered personalization
  create: protectedProcedure.input(
    z2.object({
      email: z2.string().email().optional(),
      phone: z2.string().optional(),
      role: z2.enum(["primary", "admin", "supporter"]),
      personalMessage: z2.string().optional(),
      relationship: z2.string().optional()
      // e.g., "close friend", "church member", "family"
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError3({ code: "BAD_REQUEST", message: "No household found" });
    }
    const household = await getHousehold(ctx.user.householdId);
    if (!household) {
      throw new TRPCError3({ code: "NOT_FOUND", message: "Household not found" });
    }
    const canInvite = ctx.user.role === "primary" || ctx.user.role === "admin" || ctx.user.role === "supporter";
    if (!canInvite) {
      throw new TRPCError3({
        code: "FORBIDDEN",
        message: "You don't have permission to send invites"
      });
    }
    if (!input.email && !input.phone) {
      throw new TRPCError3({
        code: "BAD_REQUEST",
        message: "Either email or phone is required"
      });
    }
    if (!household.slug) {
      throw new TRPCError3({
        code: "BAD_REQUEST",
        message: "Please set a household page URL in Settings before sending invites"
      });
    }
    let enhancedMessage = input.personalMessage;
    if (input.personalMessage && input.relationship) {
      try {
        const aiResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are helping craft a compassionate, warm invitation message for a support network app called "My Brother's Keeper". The app helps families coordinate support after losing a loved one. Your task is to enhance the personal message while keeping it authentic and heartfelt. Keep it concise (2-3 sentences max).`
            },
            {
              role: "user",
              content: `Enhance this invite message for a ${input.relationship}:

"${input.personalMessage}"

Make it warm but not overly formal. The person being invited will be a ${input.role} in the support network for ${household.name}.`
            }
          ]
        });
        const aiContent = aiResponse.choices[0]?.message?.content;
        if (aiContent && typeof aiContent === "string") {
          enhancedMessage = aiContent.trim();
        }
      } catch (error) {
        console.error("[Invite] AI enhancement failed:", error);
      }
    }
    const token = generateInviteToken();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const inviteId = await createInvite({
      householdId: ctx.user.householdId,
      invitedEmail: input.email || null,
      invitedPhone: input.phone || null,
      invitedRole: input.role,
      inviterUserId: ctx.user.id,
      token,
      status: "sent",
      expiresAt
    });
    const emailResult = await sendInviteNotification(
      input.email || null,
      input.phone || null,
      household.slug,
      household.name,
      ctx.user.name || "A friend"
    );
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: emailResult.success ? "invite_sent" : "invite_send_failed",
      targetType: "invite",
      targetId: inviteId,
      metadata: {
        email: input.email,
        phone: input.phone,
        role: input.role,
        relationship: input.relationship,
        emailSuccess: emailResult.success,
        emailError: emailResult.error || null
      }
    });
    if (!emailResult.success) {
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: `Invite created but email failed to send: ${emailResult.error}`
      });
    }
    return {
      inviteId,
      token,
      inviteLink: emailResult.inviteLink,
      enhancedMessage
    };
  }),
  // Get invite by token (public endpoint for invite acceptance page)
  getByToken: protectedProcedure.input(
    z2.object({
      token: z2.string()
    })
  ).query(async ({ input }) => {
    const invite = await getInviteByToken(input.token);
    if (!invite) {
      return null;
    }
    const household = await getHousehold(invite.householdId);
    const inviter = await getUserById(invite.inviterUserId);
    return {
      id: invite.id,
      status: invite.status,
      role: invite.invitedRole,
      email: invite.invitedEmail,
      message: null,
      // Message is not stored in DB, it's generated on-the-fly
      householdName: household?.name || "Unknown Household",
      inviterName: inviter?.name || "Someone",
      expiresAt: invite.expiresAt
    };
  }),
  // Accept an invite
  accept: protectedProcedure.input(
    z2.object({
      token: z2.string()
    })
  ).mutation(async ({ ctx, input }) => {
    const invite = await getInviteByToken(input.token);
    if (!invite) {
      throw new TRPCError3({ code: "NOT_FOUND", message: "Invite not found" });
    }
    if (invite.status !== "sent") {
      throw new TRPCError3({ code: "BAD_REQUEST", message: "Invite already used or expired" });
    }
    if (/* @__PURE__ */ new Date() > invite.expiresAt) {
      await updateInviteStatus(invite.id, "expired");
      throw new TRPCError3({ code: "BAD_REQUEST", message: "Invite has expired" });
    }
    const household = await getHousehold(invite.householdId);
    if (!household) {
      throw new TRPCError3({ code: "NOT_FOUND", message: "Household not found" });
    }
    if (invite.invitedRole === "primary") {
      await upsertUser({
        id: ctx.user.id,
        householdId: invite.householdId,
        role: "primary",
        accessTier: "family",
        status: "active"
      });
      await updateHousehold(invite.householdId, {
        primaryUserId: ctx.user.id
      });
      await updateInviteStatus(invite.id, "accepted");
      await createAuditLog({
        householdId: invite.householdId,
        actorUserId: ctx.user.id,
        action: "primary_transferred",
        targetType: "household",
        targetId: invite.householdId,
        metadata: { previousPrimaryId: household.primaryUserId, newPrimaryId: ctx.user.id }
      });
      return {
        success: true,
        householdId: invite.householdId,
        requiresApproval: false,
        isPrimary: true
      };
    }
    const alignedTier = getAccessTierForRole(invite.invitedRole);
    await upsertUser({
      id: ctx.user.id,
      householdId: invite.householdId,
      role: invite.invitedRole,
      accessTier: alignedTier,
      status: "pending"
      // Requires approval
    });
    await updateInviteStatus(invite.id, "accepted");
    await createAuditLog({
      householdId: invite.householdId,
      actorUserId: ctx.user.id,
      action: "invite_accepted",
      targetType: "invite",
      targetId: invite.id,
      metadata: { role: invite.invitedRole }
    });
    return {
      success: true,
      householdId: invite.householdId,
      requiresApproval: true,
      delegatedToAdmin: household.delegateAdminApprovals
    };
  }),
  // List pending invites (for Primary/Admin)
  listPending: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    const household = await getHousehold(ctx.user.householdId);
    if (!household) {
      return [];
    }
    const canView = ctx.user.role === "primary" || ctx.user.role === "admin" && household.delegateAdminApprovals;
    if (!canView) {
      throw new TRPCError3({
        code: "FORBIDDEN",
        message: "Only Primary or delegated Admin can view pending invites"
      });
    }
    return await getPendingInvitesByHousehold(ctx.user.householdId);
  }),
  // Resend an invite
  resend: protectedProcedure.input(
    z2.object({
      inviteId: z2.number()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError3({ code: "BAD_REQUEST", message: "No household found" });
    }
    const household = await getHousehold(ctx.user.householdId);
    if (!household) {
      throw new TRPCError3({ code: "NOT_FOUND", message: "Household not found" });
    }
    const canResend = ctx.user.role === "primary" || ctx.user.role === "admin" && household.delegateAdminApprovals;
    if (!canResend) {
      throw new TRPCError3({
        code: "FORBIDDEN",
        message: "Only Primary or delegated Admin can resend invites"
      });
    }
    const invite = await getInviteById(input.inviteId);
    if (!invite) {
      throw new TRPCError3({ code: "NOT_FOUND", message: "Invite not found" });
    }
    if (invite.householdId !== ctx.user.householdId) {
      throw new TRPCError3({ code: "FORBIDDEN", message: "Invite belongs to different household" });
    }
    if (!household.slug) {
      throw new TRPCError3({
        code: "BAD_REQUEST",
        message: "Please set a household page URL in Settings before sending invites"
      });
    }
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    await updateInvite(input.inviteId, {
      token: generateInviteToken(),
      // Keep token for backward compatibility but not used
      expiresAt: newExpiresAt,
      status: "sent"
    });
    const resendResult = await sendInviteNotification(
      invite.invitedEmail,
      invite.invitedPhone,
      household.slug,
      // Use household slug
      household.name,
      ctx.user.name || "Someone"
    );
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: resendResult.success ? "invite_resent" : "invite_resend_failed",
      targetType: "invite",
      targetId: input.inviteId,
      metadata: {
        emailSuccess: resendResult.success,
        emailError: resendResult.error || null
      }
    });
    if (!resendResult.success) {
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to resend invite: ${resendResult.error}`
      });
    }
    return { success: true };
  }),
  // Revoke an invite
  revoke: protectedProcedure.input(
    z2.object({
      inviteId: z2.number()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError3({ code: "BAD_REQUEST", message: "No household found" });
    }
    const household = await getHousehold(ctx.user.householdId);
    if (!household) {
      throw new TRPCError3({ code: "NOT_FOUND", message: "Household not found" });
    }
    const canRevoke = ctx.user.role === "primary" || ctx.user.role === "admin" && household.delegateAdminApprovals;
    if (!canRevoke) {
      throw new TRPCError3({
        code: "FORBIDDEN",
        message: "Only Primary or delegated Admin can revoke invites"
      });
    }
    await updateInviteStatus(input.inviteId, "revoked");
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "invite_revoked",
      targetType: "invite",
      targetId: input.inviteId,
      metadata: {}
    });
    return { success: true };
  })
});

// server/adminRouter.ts
import { TRPCError as TRPCError4 } from "@trpc/server";
import { z as z3 } from "zod";
import { Resend as Resend2 } from "resend";
var resend2 = new Resend2(process.env.RESEND_API_KEY);
var FROM_EMAIL2 = "Our Brother's Keeper <notifications@obkapp.com>";
function escapeHtml2(text2) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text2.replace(/[&<>"']/g, (char) => map[char]);
}
async function sendBroadcastEmail(recipientEmail, recipientName, subject, body, senderName, householdName) {
  if (!recipientEmail) {
    return { success: false, error: "No email address provided" };
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Broadcast] RESEND_API_KEY not configured - skipping email");
    return { success: false, error: "Email service not configured" };
  }
  try {
    const safeSenderName = escapeHtml2(senderName);
    const safeHouseholdName = escapeHtml2(householdName);
    const safeRecipientName = recipientName ? escapeHtml2(recipientName) : "";
    const safeSubject = escapeHtml2(subject);
    const safeBody = escapeHtml2(body).replace(/\n/g, "<br>");
    const greeting = safeRecipientName ? `Hi ${safeRecipientName},` : "Hi there,";
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6BC4B8 0%, #5A9FD4 50%, #9B7FB8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .message-box { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6BC4B8; }
          .message-title { font-size: 18px; font-weight: bold; color: #1a1a1a; margin-bottom: 12px; }
          .message-body { font-size: 15px; color: #444; line-height: 1.7; }
          .button { display: inline-block; background: #6BC4B8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .badge { display: inline-block; background: #B08CA7; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>\u{1F4E2} ${safeHouseholdName}</h1>
          </div>
          <div class="content">
            <p>${greeting}</p>
            <p><strong>${safeSenderName}</strong> has sent an important message to the support circle:</p>
            <div class="message-box">
              <div class="badge">BROADCAST MESSAGE</div>
              <div class="message-title">${safeSubject}</div>
              <div class="message-body">${safeBody}</div>
            </div>
            <p>You can view this message and respond in the Our Brother's Keeper app.</p>
            <div style="text-align: center;">
              <a href="${process.env.VITE_APP_URL || "https://obkapp.com"}/dashboard" class="button">View in App</a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">With care and support,<br>The Our Brother's Keeper Team</p>
          </div>
          <div class="footer">
            <p>You're receiving this email as a member of ${safeHouseholdName}'s support circle.</p>
            <p style="font-size: 12px; color: #999;">This is an important message from your family's support coordinator.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const result = await resend2.emails.send({
      from: FROM_EMAIL2,
      to: recipientEmail,
      subject: `[${householdName}] ${subject}`,
      // Use raw strings for email header
      html: emailHtml
    });
    console.log(`[Broadcast] Email sent to ${recipientEmail}:`, result);
    return { success: true };
  } catch (error) {
    console.error(`[Broadcast] Failed to send email to ${recipientEmail}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError4({
      code: "FORBIDDEN",
      message: "This feature is only available to admins"
    });
  }
  return next({ ctx });
});
var adminMessageRouter = router({
  // Send message to supporters
  send: adminProcedure2.input(
    z3.discriminatedUnion("recipientType", [
      z3.object({
        recipientType: z3.literal("individual"),
        recipientUserId: z3.string(),
        subject: z3.string().min(1),
        body: z3.string().min(1),
        includePrimary: z3.boolean()
      }),
      z3.object({
        recipientType: z3.literal("group"),
        recipientGroupId: z3.number(),
        subject: z3.string().min(1),
        body: z3.string().min(1),
        includePrimary: z3.boolean()
      }),
      z3.object({
        recipientType: z3.literal("all"),
        subject: z3.string().min(1),
        body: z3.string().min(1),
        includePrimary: z3.boolean()
      })
    ])
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError4({ code: "BAD_REQUEST", message: "No household found" });
    }
    let recipientIds = [];
    let recipientGroupId = null;
    if (input.recipientType === "individual") {
      recipientIds = [input.recipientUserId];
    } else if (input.recipientType === "group") {
      recipientGroupId = input.recipientGroupId;
      const members = await getAdminGroupMembers(input.recipientGroupId);
      recipientIds = members.map((m) => m.userId);
    } else {
      const users2 = await getUsersByHousehold(ctx.user.householdId);
      recipientIds = users2.filter((u) => u.status === "active" && u.role === "supporter").map((u) => u.id);
    }
    if (input.includePrimary) {
      const users2 = await getUsersByHousehold(ctx.user.householdId);
      const primary = users2.find((u) => u.role === "primary");
      if (primary) {
        recipientIds.push(primary.id);
      }
    }
    const messageId = await createAdminMessage({
      householdId: ctx.user.householdId,
      senderId: ctx.user.id,
      subject: input.subject,
      body: input.body,
      recipientType: input.recipientType,
      recipientGroupId,
      includedPrimary: input.includePrimary
    });
    for (const recipientId of recipientIds) {
      await createAdminMessageRecipient({
        messageId,
        userId: recipientId
      });
    }
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "admin_message_sent",
      targetType: "admin_message",
      targetId: messageId,
      metadata: {
        recipientType: input.recipientType,
        recipientCount: recipientIds.length,
        includedPrimary: input.includePrimary
      }
    });
    const household = await getHousehold(ctx.user.householdId);
    if (!household) {
      throw new TRPCError4({ code: "NOT_FOUND", message: "Household not found" });
    }
    const senderName = ctx.user.name || "An admin";
    let emailsSent = 0;
    let emailsFailed = 0;
    for (const recipientId of recipientIds) {
      const recipient = await getUserById(recipientId);
      if (recipient && recipient.email) {
        const result = await sendBroadcastEmail(
          recipient.email,
          recipient.name,
          input.subject,
          input.body,
          senderName,
          household.name
        );
        if (result.success) {
          emailsSent++;
        } else {
          emailsFailed++;
          console.warn(`[Broadcast] Failed to send email to ${recipient.email}:`, result.error);
        }
      } else {
        console.warn(`[Broadcast] Skipping user ${recipientId} - no email address`);
      }
    }
    console.log(`[Broadcast] Sent ${emailsSent} emails, ${emailsFailed} failed out of ${recipientIds.length} total recipients`);
    return {
      success: true,
      messageId,
      recipientCount: recipientIds.length,
      emailsSent,
      emailsFailed
    };
  }),
  // List sent messages
  listSent: adminProcedure2.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    return await getAdminMessagesByHousehold(ctx.user.householdId);
  })
});
var adminGroupRouter = router({
  // Create custom group
  create: adminProcedure2.input(
    z3.object({
      name: z3.string().min(1),
      description: z3.string().optional(),
      memberIds: z3.array(z3.string()).min(1)
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError4({ code: "BAD_REQUEST", message: "No household found" });
    }
    const groupId = await createAdminGroup({
      householdId: ctx.user.householdId,
      createdBy: ctx.user.id,
      name: input.name,
      description: input.description || null
    });
    for (const memberId of input.memberIds) {
      await addAdminGroupMember({
        groupId,
        userId: memberId
      });
    }
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "admin_group_created",
      targetType: "admin_group",
      targetId: groupId,
      metadata: { memberCount: input.memberIds.length }
    });
    return { success: true, groupId };
  }),
  // List admin groups
  list: adminProcedure2.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    return await getAdminGroupsByHousehold(ctx.user.householdId);
  }),
  // Delete group
  delete: adminProcedure2.input(
    z3.object({
      groupId: z3.number()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError4({ code: "BAD_REQUEST", message: "No household found" });
    }
    const group = await getAdminGroup(input.groupId);
    if (!group || group.householdId !== ctx.user.householdId) {
      throw new TRPCError4({ code: "FORBIDDEN", message: "Group not found" });
    }
    await deleteAdminGroup(input.groupId);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "admin_group_deleted",
      targetType: "admin_group",
      targetId: input.groupId,
      metadata: {}
    });
    return { success: true };
  })
});

// server/updatesRouter.ts
import { TRPCError as TRPCError5 } from "@trpc/server";
import { z as z4 } from "zod";

// server/emailService.ts
import { Resend as Resend3 } from "resend";
import { eq as eq2, and as and2 } from "drizzle-orm";
var resend3 = new Resend3(process.env.RESEND_API_KEY);
var FROM_EMAIL3 = "Our Brother's Keeper <notifications@obkapp.com>";
function getEmailTemplate(type, context) {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #6BC4B8 0%, #5A9FD4 50%, #9B7FB8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
      .header h1 { color: white; margin: 0; font-size: 24px; }
      .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .button { display: inline-block; background: #6BC4B8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
    </style>
  `;
  const templates = {
    need_created: {
      subject: `\u{1F91D} New Support Request: ${context.needTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>A new support request has been posted to ${context.householdName}'s support circle:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #6BC4B8;">${context.needTitle}</h3>
          <p style="margin: 0;">${context.needDescription}</p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;"><strong>Category:</strong> ${context.needCategory}</p>
        </div>
        <p>If you're able to help, please click the button below to view details and claim this request.</p>
      `
    },
    need_claimed: {
      subject: `\u2705 Support Request Claimed: ${context.needTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p><strong>${context.claimerName}</strong> has claimed the following support request:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #6BC4B8;">${context.needTitle}</h3>
        </div>
        <p>Thank you for being part of this caring community!</p>
      `
    },
    need_unclaimed: {
      subject: `\u26A0\uFE0F Support Request Available Again: ${context.needTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p><strong>${context.unclaimerName}</strong> has released their claim on the following support request:</p>
        <div style="background: #fff4e6; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #f59e0b;">${context.needTitle}</h3>
        </div>
        <p>This request is now available again if someone else would like to help. Thank you for your flexibility and understanding!</p>
      `
    },
    need_completed: {
      subject: `\u{1F389} Support Request Completed: ${context.needTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>Great news! <strong>${context.completerName}</strong> has completed the following support request:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #B08CA7; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #B08CA7;">${context.needTitle}</h3>
        </div>
        <p>Your support network is making a real difference during this difficult time.</p>
      `
    },
    event_created: {
      subject: `\u{1F4C5} New Event: ${context.eventTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>A new event has been scheduled for ${context.householdName}'s support circle:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #6BC4B8;">${context.eventTitle}</h3>
          <p style="margin: 5px 0;"><strong>\u{1F4C5} When:</strong> ${context.eventDate} at ${context.eventTime}</p>
          ${context.eventLocation ? `<p style="margin: 5px 0;"><strong>\u{1F4CD} Where:</strong> ${context.eventLocation}</p>` : ""}
          ${context.eventDescription ? `<p style="margin: 10px 0 0 0;">${context.eventDescription}</p>` : ""}
        </div>
        <p>Please let us know if you can attend.</p>
      `
    },
    event_rsvp: {
      subject: `\u{1F44B} ${context.rsvperName} ${context.rsvpStatus} to ${context.eventTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p><strong>${context.rsvperName}</strong> has responded to your event:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #6BC4B8;">${context.eventTitle}</h3>
          <p style="margin: 0; font-size: 18px;"><strong>Response:</strong> ${context.rsvpStatus === "going" ? "\u2705 Going" : context.rsvpStatus === "maybe" ? "\u{1F914} Maybe" : "\u274C Can't Make It"}</p>
        </div>
      `
    },
    meal_train_signup: {
      subject: `\u{1F37D}\uFE0F ${context.volunteerName} Signed Up for ${context.mealDate}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>Wonderful news! <strong>${context.volunteerName}</strong> has signed up to bring a meal:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>\u{1F4C5} Date:</strong> ${context.mealDate}</p>
          ${context.volunteerNote ? `<p style="margin: 10px 0 0 0;"><strong>Note:</strong> ${context.volunteerNote}</p>` : ""}
        </div>
        <p>The meal train is filling up beautifully thanks to your caring community!</p>
      `
    },
    meal_train_cancelled: {
      subject: `\u274C Meal Signup Cancelled for ${context.mealDate}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p><strong>${context.volunteerName}</strong> has cancelled their meal signup for:</p>
        <div style="background: #fff4e6; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>\u{1F4C5} Date:</strong> ${context.mealDate}</p>
        </div>
        <p>This slot is now available if anyone else would like to sign up.</p>
      `
    },
    new_message: {
      subject: `\u{1F4AC} New Message from ${context.senderName}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p><strong>${context.senderName}</strong> sent you a message:</p>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;">${context.messageBody}</p>
        </div>
        <p>Click below to view and respond.</p>
      `
    },
    new_announcement: {
      subject: `\u{1F4E2} Announcement from ${context.householdName}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>${context.householdName} has posted a new announcement:</p>
        <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0; font-weight: 600;">${context.announcementBody}</p>
        </div>
      `
    },
    new_update: {
      subject: `\u{1F4F0} New Update from ${context.householdName}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>${context.householdName} has shared a new update:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #B08CA7; margin: 20px 0;">
          ${context.updateTitle ? `<h3 style="margin: 0 0 10px 0; color: #B08CA7;">${context.updateTitle}</h3>` : ""}
          <p style="margin: 0;">${context.updateBody}</p>
        </div>
      `
    },
    need_reminder: {
      subject: `\u{1F514} Reminder: ${context.needTitle} is coming up`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>This is a friendly reminder about an upcoming support need you set a reminder for:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #6BC4B8;">${context.needTitle}</h3>
          <p style="margin: 0;">${context.needDescription}</p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;"><strong>Due:</strong> ${context.needDueDate}</p>
        </div>
        <p>Click the button below to view the details.</p>
      `
    },
    event_reminder: {
      subject: `\u{1F514} Reminder: ${context.eventTitle} is coming up`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>This is a friendly reminder about an upcoming event you set a reminder for:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #B08CA7; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #B08CA7;">${context.eventTitle}</h3>
          ${context.eventDescription ? `<p style="margin: 0;">${context.eventDescription}</p>` : ""}
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;"><strong>When:</strong> ${context.eventStartTime}</p>
          ${context.eventLocation ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;"><strong>Where:</strong> ${context.eventLocation}</p>` : ""}
        </div>
        <p>Click the button below to view the event details.</p>
      `
    },
    personal_reminder: {
      subject: `\u{1F514} Reminder: ${context.reminderTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>This is your personal reminder:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #2DB5A8; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #2DB5A8;">${context.reminderTitle}</h3>
          ${context.reminderDescription ? `<p style="margin: 0;">${context.reminderDescription}</p>` : ""}
        </div>
        <p>Take care and remember you're doing great supporting ${context.householdName}!</p>
      `
    },
    invite_sent: {
      subject: `\u{1F48C} You're Invited to Support ${context.householdName}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p><strong>${context.inviterName}</strong> has invited you to join <strong>${context.householdName}'s</strong> support circle on Our Brother's Keeper.</p>
        <div style="background: #f9fafb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0; font-size: 16px;">Our Brother's Keeper is a compassionate platform designed to help families coordinate support during difficult times.</p>
        </div>
        <p>Click the button below to accept the invitation and join this caring community.</p>
      `
    }
  };
  const template = templates[type];
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>\u{1F90D} Our Brother's Keeper</h1>
        </div>
        <div class="content">
          ${template.body}
          ${context.actionUrl ? `<div style="text-align: center;"><a href="${context.actionUrl}" class="button">View Details</a></div>` : ""}
          <div class="divider"></div>
          <p style="color: #666; font-size: 14px; margin: 0;">With care and support,<br>The Our Brother's Keeper Team</p>
        </div>
        <div class="footer">
          <p>You're receiving this email because you're part of ${context.householdName || "a support circle"}.</p>
          <p style="font-size: 12px; color: #999;">You can manage your notification preferences in your account settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject: template.subject, html };
}
async function sendNotificationEmail(userId, householdId, notificationType, context) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Database not available");
      return;
    }
    const [prefs, user] = await Promise.all([
      db.select().from(notificationPreferences).where(
        and2(
          eq2(notificationPreferences.userId, userId),
          eq2(notificationPreferences.householdId, householdId)
        )
      ).limit(1),
      db.select().from(users).where(eq2(users.id, userId)).limit(1)
    ]);
    if (!user[0]?.email) {
      console.error(`No email found for user ${userId}`);
      return;
    }
    const userPrefs = prefs[0];
    if (!userPrefs || !userPrefs.emailEnabled) {
      return;
    }
    const prefKey = `email${notificationType.split("_").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("")}`;
    if (!userPrefs[prefKey]) {
      return;
    }
    const emailContext = {
      ...context,
      recipientName: context.recipientName || user[0].name || user[0].firstName || "Friend",
      recipientEmail: user[0].email
    };
    const { subject, html } = getEmailTemplate(notificationType, emailContext);
    const result = await resend3.emails.send({
      from: FROM_EMAIL3,
      to: user[0].email,
      subject,
      html
    });
    await db.insert(notificationLogs).values({
      userId,
      householdId,
      notificationType,
      channel: "email",
      subject,
      body: html,
      metadata: context,
      delivered: !!result.data?.id,
      deliveredAt: result.data?.id ? /* @__PURE__ */ new Date() : null,
      error: result.error ? JSON.stringify(result.error) : null
    });
    if (result.error) {
      console.error("Failed to send email:", result.error);
    }
  } catch (error) {
    console.error("Error sending notification email:", error);
    const db = await getDb();
    if (db) {
      await db.insert(notificationLogs).values({
        userId,
        householdId,
        notificationType,
        channel: "email",
        subject: "Error",
        body: "",
        delivered: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}
async function sendBulkNotificationEmails(userIds, householdId, notificationType, contextFn) {
  await Promise.all(
    userIds.map(
      (userId) => sendNotificationEmail(userId, householdId, notificationType, contextFn(userId))
    )
  );
}

// server/notificationHelpers.ts
import { eq as eq3, and as and3 } from "drizzle-orm";
async function notifyVisibleUsers(householdId, targetUserIds, notificationType, baseContext, excludeUserIds = []) {
  try {
    const household = await getHousehold(householdId);
    if (!household) {
      console.error(`Household ${householdId} not found for notifications`);
      return;
    }
    const eligibleUserIds = targetUserIds.filter((id) => !excludeUserIds.includes(id));
    if (eligibleUserIds.length === 0) {
      return;
    }
    const allMembers = await getUsersByHousehold(householdId);
    const eligibleMembers = allMembers.filter((m) => eligibleUserIds.includes(m.id) && m.status === "active");
    const notificationTypePreferenceMap = {
      need_created: "emailNeedCreated",
      need_claimed: "emailNeedClaimed",
      need_unclaimed: "emailNeedUnclaimed",
      need_completed: "emailNeedCompleted",
      need_reminder: "emailNeedReminder",
      event_created: "emailEventCreated",
      event_rsvp: "emailEventRsvp",
      event_reminder: "emailEventReminder",
      meal_train_signup: "emailMealTrainSignup",
      meal_train_cancelled: "emailMealTrainCancelled",
      new_message: "emailNewMessage",
      new_announcement: "emailNewAnnouncement",
      new_update: "emailNewUpdate",
      invite_sent: "emailEnabled"
      // invites don't have a specific preference
    };
    const membersWithOptIn = [];
    const db = await getDb();
    if (!db) {
      console.error("Database not available for notification preferences check");
      return;
    }
    for (const member of eligibleMembers) {
      const prefsResult = await db.select().from(notificationPreferences).where(
        and3(
          eq3(notificationPreferences.userId, member.id),
          eq3(notificationPreferences.householdId, householdId)
        )
      ).limit(1);
      const prefs = prefsResult[0];
      if (!prefs || !prefs.emailEnabled) {
        continue;
      }
      const prefKey = notificationTypePreferenceMap[notificationType];
      if (prefs[prefKey]) {
        membersWithOptIn.push(member.id);
      }
    }
    if (membersWithOptIn.length === 0) {
      console.log(`No users opted in for ${notificationType} notifications`);
      return;
    }
    await sendBulkNotificationEmails(
      membersWithOptIn,
      householdId,
      notificationType,
      (userId) => ({
        ...baseContext,
        householdName: household.name,
        recipientName: eligibleMembers.find((m) => m.id === userId)?.name || "Friend",
        recipientEmail: eligibleMembers.find((m) => m.id === userId)?.email || ""
      })
    );
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
}

// server/updatesRouter.ts
var updatesRouter = router({
  // Create update
  create: protectedProcedure.input(
    z4.object({
      type: z4.enum(["general", "gratitude", "memory", "milestone"]),
      title: z4.string().min(1),
      body: z4.string().min(1),
      photoUrls: z4.array(z4.string()).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError5({ code: "BAD_REQUEST", message: "No household found" });
    }
    if (ctx.user.role !== "primary" && ctx.user.role !== "admin") {
      throw new TRPCError5({
        code: "FORBIDDEN",
        message: "Only Primary or Admin can post updates"
      });
    }
    const updateId = await createUpdate({
      householdId: ctx.user.householdId,
      authorId: ctx.user.id,
      type: input.type,
      title: input.title,
      body: input.body,
      photoUrls: input.photoUrls || null
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "update_posted",
      targetType: "update",
      targetId: updateId,
      metadata: { type: input.type, hasPhotos: (input.photoUrls?.length || 0) > 0 }
    });
    const allMembers = await getUsersByHousehold(ctx.user.householdId);
    const targetUserIds = allMembers.map((m) => m.id);
    notifyVisibleUsers(
      ctx.user.householdId,
      targetUserIds,
      "new_update",
      {
        updateTitle: input.title,
        updateBody: input.body.substring(0, 150) + (input.body.length > 150 ? "..." : ""),
        actionUrl: `${process.env.REPL_HOME || ""}/updates`
      },
      [ctx.user.id]
    ).catch((err) => console.error("Failed to send new_update notification:", err));
    return { success: true, updateId };
  }),
  // List updates
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    return await getUpdatesByHousehold(ctx.user.householdId);
  }),
  // Delete update
  delete: protectedProcedure.input(
    z4.object({
      updateId: z4.number()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError5({ code: "BAD_REQUEST", message: "No household found" });
    }
    const update = await getUpdate(input.updateId);
    if (!update) {
      throw new TRPCError5({ code: "NOT_FOUND", message: "Update not found" });
    }
    if (update.householdId !== ctx.user.householdId) {
      throw new TRPCError5({ code: "FORBIDDEN", message: "Update belongs to different household" });
    }
    if (update.authorId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "primary") {
      throw new TRPCError5({ code: "FORBIDDEN", message: "Only the author, admin, or primary can delete" });
    }
    await deleteUpdate(input.updateId);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "update_deleted",
      targetType: "update",
      targetId: input.updateId,
      metadata: {}
    });
    return { success: true };
  })
});

// server/needsRouter.ts
import { TRPCError as TRPCError6 } from "@trpc/server";
import { z as z5 } from "zod";

// server/visibilityHelpers.ts
function checkContentVisibilitySync(userId, userRole, userAccessTier, userGroupIds, content) {
  const isPrimaryOrAdmin = userRole === "primary" || userRole === "admin";
  if (isPrimaryOrAdmin) {
    return true;
  }
  if (userAccessTier === "community") {
    if (content.visibilityScope === "custom" && content.customUserIds) {
      return content.customUserIds.includes(userId);
    }
    return false;
  }
  if (content.visibilityScope === "all_supporters") {
    return true;
  } else if (content.visibilityScope === "role") {
    return false;
  } else if (content.visibilityScope === "group" && content.visibilityGroupIds && content.visibilityGroupIds.length > 0) {
    return content.visibilityGroupIds.some((groupId) => userGroupIds.includes(groupId));
  } else if (content.visibilityScope === "custom" && content.customUserIds) {
    return content.customUserIds.includes(userId);
  } else if (content.visibilityScope === "private") {
    return false;
  }
  return false;
}
async function filterByVisibility(items, userId, userRole, userAccessTier, householdId) {
  if (items.length === 0) {
    return [];
  }
  const userGroups = await getUserGroups(userId, householdId);
  const userGroupIds = userGroups.map((g) => g.id);
  const visibleItems = [];
  for (const item of items) {
    const canView = checkContentVisibilitySync(userId, userRole, userAccessTier, userGroupIds, item);
    if (canView) {
      visibleItems.push(item);
    }
  }
  return visibleItems;
}

// server/needsRouter.ts
var needsRouter = router({
  // List all needs for the household (filtered by visibility)
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    const allNeeds = await getNeedsByHousehold(ctx.user.householdId);
    const visibleNeeds = await filterByVisibility(
      allNeeds,
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    const needsWithUserClaim = visibleNeeds.map((need) => {
      const userClaim = need.claims?.find((claim) => claim.userId === ctx.user.id && claim.status === "claimed");
      return {
        ...need,
        currentUserClaimId: userClaim?.id || null
      };
    });
    return needsWithUserClaim;
  }),
  // List needs claimed by the current user
  listUserClaims: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    const allNeeds = await getNeedsByHousehold(ctx.user.householdId);
    const userClaimedNeeds = allNeeds.filter((need) => {
      return need.claims?.some(
        (claim) => claim.userId === ctx.user.id && claim.status === "claimed"
      );
    });
    const visibleNeeds = await filterByVisibility(
      userClaimedNeeds,
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    return visibleNeeds;
  }),
  // Get a single need with claims
  get: protectedProcedure.input(z5.object({ id: z5.number() })).query(async ({ ctx, input }) => {
    const need = await getNeed(input.id);
    if (!need) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    if (need.householdId !== ctx.user.householdId) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    const visibleNeeds = await filterByVisibility(
      [need],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleNeeds.length === 0) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    const claims = await getClaimsByNeed(input.id);
    return { need, claims };
  }),
  // Create a new need
  create: protectedProcedure.input(
    z5.object({
      title: z5.string().min(1),
      details: z5.string().optional(),
      category: z5.enum(["meals", "rides", "errands", "childcare", "household", "other"]),
      priority: z5.enum(["low", "normal", "urgent"]).default("normal"),
      dueAt: z5.date().optional(),
      visibilityScope: z5.enum(["private", "all_supporters", "group", "role", "custom"]).default("all_supporters"),
      visibilityGroupIds: z5.array(z5.number()).optional(),
      customUserIds: z5.array(z5.string()).optional(),
      capacity: z5.number().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "No household found" });
    }
    const canCreate = ctx.user.role === "primary" || ctx.user.role === "admin";
    if (!canCreate) {
      throw new TRPCError6({
        code: "FORBIDDEN",
        message: "Only Primary or Admin can create needs"
      });
    }
    const needId = await createNeed({
      householdId: ctx.user.householdId,
      title: input.title,
      details: input.details || null,
      category: input.category,
      priority: input.priority,
      dueAt: input.dueAt || null,
      createdBy: ctx.user.id,
      visibilityScope: input.visibilityScope,
      visibilityGroupIds: input.visibilityGroupIds || null,
      customUserIds: input.customUserIds || null,
      status: "open",
      capacity: input.capacity || null
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "need_created",
      targetType: "need",
      targetId: needId,
      metadata: { title: input.title, category: input.category }
    });
    const createdNeed = await getNeed(needId);
    if (createdNeed) {
      const allMembers = await getUsersByHousehold(ctx.user.householdId);
      const targetUserIds = [];
      for (const member of allMembers) {
        const visibleNeeds = await filterByVisibility(
          [createdNeed],
          member.id,
          member.role,
          member.accessTier,
          ctx.user.householdId
        );
        if (visibleNeeds.length > 0) {
          targetUserIds.push(member.id);
        }
      }
      if (targetUserIds.length > 0) {
        const categoryLabels = {
          meals: "Meals",
          rides: "Transportation",
          errands: "Errands",
          childcare: "Childcare",
          household: "Household Tasks",
          other: "Other Support"
        };
        notifyVisibleUsers(
          ctx.user.householdId,
          targetUserIds,
          "need_created",
          {
            needTitle: input.title,
            needDescription: input.details || "No additional details provided.",
            needCategory: categoryLabels[input.category] || input.category,
            actionUrl: `${process.env.REPL_HOME || ""}/needs`
          },
          [ctx.user.id]
        ).catch((err) => console.error("Failed to send need_created notification:", err));
      }
    }
    return { needId };
  }),
  // Update a need
  update: protectedProcedure.input(
    z5.object({
      id: z5.number(),
      title: z5.string().min(1).optional(),
      details: z5.string().optional(),
      category: z5.enum(["meals", "rides", "errands", "childcare", "household", "other"]).optional(),
      priority: z5.enum(["low", "normal", "urgent"]).optional(),
      dueAt: z5.date().optional(),
      status: z5.enum(["open", "claimed", "completed", "cancelled"]).optional(),
      capacity: z5.number().optional(),
      visibilityScope: z5.enum(["private", "all_supporters", "group", "role", "custom"]).optional(),
      visibilityGroupIds: z5.array(z5.number()).optional(),
      customUserIds: z5.array(z5.string()).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "No household found" });
    }
    const need = await getNeed(input.id);
    if (!need) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    if (need.householdId !== ctx.user.householdId) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    const visibleNeeds = await filterByVisibility(
      [need],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleNeeds.length === 0) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    const canUpdate = ctx.user.role === "primary" || ctx.user.role === "admin" || need.createdBy === ctx.user.id;
    if (!canUpdate) {
      throw new TRPCError6({
        code: "FORBIDDEN",
        message: "Only Primary, Admin, or creator can update needs"
      });
    }
    const { id, ...updateData } = input;
    await updateNeed(id, updateData);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "need_updated",
      targetType: "need",
      targetId: id,
      metadata: updateData
    });
    return { success: true };
  }),
  // Delete a need
  delete: protectedProcedure.input(z5.object({ id: z5.number() })).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "No household found" });
    }
    const need = await getNeed(input.id);
    if (!need) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    if (need.householdId !== ctx.user.householdId) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    const visibleNeeds = await filterByVisibility(
      [need],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleNeeds.length === 0) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    const canDelete = ctx.user.role === "primary" || ctx.user.role === "admin" || need.createdBy === ctx.user.id;
    if (!canDelete) {
      throw new TRPCError6({
        code: "FORBIDDEN",
        message: "Only Primary, Admin, or creator can delete needs"
      });
    }
    await deleteNeed(input.id);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "need_deleted",
      targetType: "need",
      targetId: input.id,
      metadata: { title: need.title }
    });
    return { success: true };
  }),
  // Claim a need
  claim: protectedProcedure.input(
    z5.object({
      needId: z5.number(),
      note: z5.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "No household found" });
    }
    const need = await getNeed(input.needId);
    if (!need) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    if (need.householdId !== ctx.user.householdId) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    const visibleNeeds = await filterByVisibility(
      [need],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleNeeds.length === 0) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    if (need.status !== "open") {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "Need is not available to claim" });
    }
    const isPrivileged = ctx.user.role === "primary" || ctx.user.role === "admin";
    const now = /* @__PURE__ */ new Date();
    const dueAt = need.dueAt ? new Date(need.dueAt) : null;
    if (!isPrivileged && dueAt && dueAt.getTime() < now.getTime()) {
      throw new TRPCError6({
        code: "FORBIDDEN",
        message: "Cannot claim past-due needs"
      });
    }
    const claimId = await createNeedClaim({
      needId: input.needId,
      userId: ctx.user.id,
      note: input.note || null,
      status: "claimed"
    });
    await updateNeed(input.needId, { status: "claimed" });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "need_claimed",
      targetType: "need",
      targetId: input.needId,
      metadata: { claimId, note: input.note }
    });
    const allMembers = await getUsersByHousehold(ctx.user.householdId);
    const adminUserIds = allMembers.filter((m) => m.role === "primary" || m.role === "admin").map((m) => m.id);
    notifyVisibleUsers(
      ctx.user.householdId,
      adminUserIds,
      "need_claimed",
      {
        needTitle: need.title,
        claimerName: ctx.user.name,
        actionUrl: `${process.env.REPL_HOME || ""}/needs`
      },
      [ctx.user.id]
    ).catch((err) => console.error("Failed to send need_claimed notification:", err));
    return { claimId };
  }),
  // Mark a need as completed (simplified endpoint)
  complete: protectedProcedure.input(
    z5.object({
      needId: z5.number(),
      completionNote: z5.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "No household found" });
    }
    const need = await getNeed(input.needId);
    if (!need) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    if (need.householdId !== ctx.user.householdId) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    const visibleNeeds = await filterByVisibility(
      [need],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleNeeds.length === 0) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Need not found" });
    }
    const claims = await getClaimsByNeed(input.needId);
    const userClaim = claims.find((c) => c.userId === ctx.user.id);
    const canComplete = ctx.user.role === "primary" || ctx.user.role === "admin" || userClaim !== void 0;
    if (!canComplete) {
      throw new TRPCError6({
        code: "FORBIDDEN",
        message: "Only the claimer, Primary, or Admin can mark as completed"
      });
    }
    await updateNeed(input.needId, {
      status: "completed",
      completedAt: /* @__PURE__ */ new Date()
    });
    for (const claim of claims) {
      await updateNeedClaim(claim.id, {
        status: "completed",
        completedAt: /* @__PURE__ */ new Date()
      });
    }
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "need_completed",
      targetType: "need",
      targetId: input.needId,
      metadata: { completionNote: input.completionNote }
    });
    const allMembers = await getUsersByHousehold(ctx.user.householdId);
    const adminUserIds = allMembers.filter((m) => m.role === "primary" || m.role === "admin").map((m) => m.id);
    notifyVisibleUsers(
      ctx.user.householdId,
      adminUserIds,
      "need_completed",
      {
        needTitle: need.title,
        completerName: ctx.user.name,
        actionUrl: `${process.env.REPL_HOME || ""}/needs`
      },
      [ctx.user.id]
    ).catch((err) => console.error("Failed to send need_completed notification:", err));
    return { success: true };
  }),
  // Mark claim as completed (legacy endpoint)
  completeClaim: protectedProcedure.input(z5.object({ claimId: z5.number() })).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "No household found" });
    }
    const claim = await getNeedClaim(input.claimId);
    if (!claim) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Claim not found" });
    }
    const need = await getNeed(claim.needId);
    if (!need) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Claim not found" });
    }
    if (need.householdId !== ctx.user.householdId) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Claim not found" });
    }
    const visibleNeeds = await filterByVisibility(
      [need],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleNeeds.length === 0) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Claim not found" });
    }
    await updateNeedClaim(input.claimId, {
      status: "completed",
      completedAt: /* @__PURE__ */ new Date()
    });
    await updateNeed(claim.needId, {
      status: "completed",
      completedAt: /* @__PURE__ */ new Date()
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "need_completed",
      targetType: "need",
      targetId: claim.needId,
      metadata: { claimId: input.claimId }
    });
    return { success: true };
  }),
  // Release a claim (unclaim)
  releaseClaim: protectedProcedure.input(z5.object({ claimId: z5.number() })).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "No household found" });
    }
    const claim = await getNeedClaim(input.claimId);
    if (!claim) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Claim not found" });
    }
    const need = await getNeed(claim.needId);
    if (!need) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Claim not found" });
    }
    if (need.householdId !== ctx.user.householdId) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Claim not found" });
    }
    const visibleNeeds = await filterByVisibility(
      [need],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleNeeds.length === 0) {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Claim not found" });
    }
    await updateNeedClaim(input.claimId, { status: "released" });
    await updateNeed(claim.needId, { status: "open" });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "need_claim_released",
      targetType: "need_claim",
      targetId: input.claimId,
      metadata: {}
    });
    const allMembers = await getUsersByHousehold(ctx.user.householdId);
    const adminUserIds = allMembers.filter((m) => m.role === "primary" || m.role === "admin").map((m) => m.id);
    notifyVisibleUsers(
      ctx.user.householdId,
      adminUserIds,
      "need_unclaimed",
      {
        needTitle: need.title,
        unclaimerName: ctx.user.name,
        actionUrl: `${process.env.REPL_HOME || ""}/needs`
      },
      [ctx.user.id]
    ).catch((err) => console.error("Failed to send need_unclaimed notification:", err));
    return { success: true };
  })
});

// server/eventsRouter.ts
import { TRPCError as TRPCError7 } from "@trpc/server";
import { z as z6 } from "zod";
var eventsRouter = router({
  // List all events for the household (filtered by visibility)
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    const allEvents = await getEventsByHousehold(ctx.user.householdId, ctx.user.id);
    const visibleEvents = await filterByVisibility(
      allEvents,
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    return visibleEvents;
  }),
  // Get a single event with RSVPs
  get: protectedProcedure.input(z6.object({ id: z6.number() })).query(async ({ ctx, input }) => {
    const event = await getEvent(input.id);
    if (!event) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Event not found" });
    }
    if (event.householdId !== ctx.user.householdId) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Event not found" });
    }
    const visibleEvents = await filterByVisibility(
      [event],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleEvents.length === 0) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Event not found" });
    }
    const rsvps = await getRsvpsByEvent(input.id);
    return { event, rsvps };
  }),
  // Create a new event
  create: protectedProcedure.input(
    z6.object({
      title: z6.string().min(1),
      description: z6.string().optional(),
      location: z6.string().optional(),
      startAt: z6.date(),
      endAt: z6.date().optional(),
      eventType: z6.enum(["regular", "birthday", "anniversary", "milestone", "holiday"]).default("regular"),
      recurring: z6.boolean().default(false),
      associatedUserId: z6.string().optional(),
      visibilityScope: z6.enum(["private", "all_supporters", "group", "role", "custom"]).default("all_supporters"),
      visibilityGroupIds: z6.array(z6.number()).optional(),
      customUserIds: z6.array(z6.string()).optional(),
      capacity: z6.number().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError7({ code: "BAD_REQUEST", message: "No household found" });
    }
    const canCreate = ctx.user.role === "primary" || ctx.user.role === "admin";
    if (!canCreate) {
      throw new TRPCError7({
        code: "FORBIDDEN",
        message: "Only Primary or Admin can create events"
      });
    }
    const eventId = await createEvent({
      householdId: ctx.user.householdId,
      title: input.title,
      description: input.description || null,
      location: input.location || null,
      startAt: input.startAt,
      endAt: input.endAt || null,
      createdBy: ctx.user.id,
      eventType: input.eventType,
      recurring: input.recurring,
      associatedUserId: input.associatedUserId || null,
      visibilityScope: input.visibilityScope,
      visibilityGroupIds: input.visibilityGroupIds || null,
      customUserIds: input.customUserIds || null,
      capacity: input.capacity || null
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "event_created",
      targetType: "event",
      targetId: eventId,
      metadata: { title: input.title, startAt: input.startAt.toISOString() }
    });
    const createdEvent = await getEvent(eventId);
    if (createdEvent) {
      const allMembers = await getUsersByHousehold(ctx.user.householdId);
      const targetUserIds = [];
      for (const member of allMembers) {
        const visibleEvents = await filterByVisibility(
          [createdEvent],
          member.id,
          member.role,
          member.accessTier,
          ctx.user.householdId
        );
        if (visibleEvents.length > 0) {
          targetUserIds.push(member.id);
        }
      }
      if (targetUserIds.length > 0) {
        notifyVisibleUsers(
          ctx.user.householdId,
          targetUserIds,
          "event_created",
          {
            eventTitle: input.title,
            eventDescription: input.description || "No description provided.",
            eventLocation: input.location || "Location to be determined.",
            eventDate: input.startAt.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            }),
            eventTime: input.startAt.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true
            }),
            actionUrl: `${process.env.REPL_HOME || ""}/calendar`
          },
          [ctx.user.id]
        ).catch((err) => console.error("Failed to send event_created notification:", err));
      }
    }
    return { eventId };
  }),
  // Update an event
  update: protectedProcedure.input(
    z6.object({
      id: z6.number(),
      title: z6.string().min(1).optional(),
      description: z6.string().optional(),
      location: z6.string().optional(),
      startAt: z6.date().optional(),
      endAt: z6.date().optional(),
      eventType: z6.enum(["regular", "birthday", "anniversary", "milestone", "holiday"]).optional(),
      recurring: z6.boolean().optional(),
      associatedUserId: z6.string().optional(),
      capacity: z6.number().optional(),
      visibilityScope: z6.enum(["private", "all_supporters", "group", "role", "custom"]).optional(),
      visibilityGroupIds: z6.array(z6.number()).optional(),
      customUserIds: z6.array(z6.string()).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError7({ code: "BAD_REQUEST", message: "No household found" });
    }
    const event = await getEvent(input.id);
    if (!event) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Event not found" });
    }
    if (event.householdId !== ctx.user.householdId) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Event not found" });
    }
    const visibleEvents = await filterByVisibility(
      [event],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleEvents.length === 0) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Event not found" });
    }
    const canUpdate = ctx.user.role === "primary" || ctx.user.role === "admin" || event.createdBy === ctx.user.id;
    if (!canUpdate) {
      throw new TRPCError7({
        code: "FORBIDDEN",
        message: "Only Primary, Admin, or creator can update events"
      });
    }
    const importantDateTypes = ["birthday", "anniversary", "milestone", "holiday"];
    const isExistingImportantDate = event.eventType && importantDateTypes.includes(event.eventType);
    const isChangingToImportantDate = input.eventType && importantDateTypes.includes(input.eventType);
    if (isExistingImportantDate || isChangingToImportantDate) {
      const canManageImportantDates = ctx.user.role === "primary" || ctx.user.role === "admin";
      if (!canManageImportantDates) {
        throw new TRPCError7({
          code: "FORBIDDEN",
          message: "Only Primary or Admin can create or modify important dates (birthdays, anniversaries, milestones, holidays)"
        });
      }
    }
    if (input.associatedUserId !== void 0 && input.associatedUserId !== null) {
      const canAssociate = ctx.user.role === "primary" || ctx.user.role === "admin";
      if (!canAssociate) {
        throw new TRPCError7({
          code: "FORBIDDEN",
          message: "Only Primary or Admin can associate events with specific people"
        });
      }
    }
    const { id, ...updateData } = input;
    await updateEvent(id, updateData);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "event_updated",
      targetType: "event",
      targetId: id,
      metadata: updateData
    });
    return { success: true };
  }),
  // Delete an event
  delete: protectedProcedure.input(z6.object({ id: z6.number() })).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError7({ code: "BAD_REQUEST", message: "No household found" });
    }
    const event = await getEvent(input.id);
    if (!event) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Event not found" });
    }
    if (event.householdId !== ctx.user.householdId) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Event not found" });
    }
    const visibleEvents = await filterByVisibility(
      [event],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleEvents.length === 0) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Event not found" });
    }
    const canDelete = ctx.user.role === "primary" || ctx.user.role === "admin" || event.createdBy === ctx.user.id;
    if (!canDelete) {
      throw new TRPCError7({
        code: "FORBIDDEN",
        message: "Only Primary, Admin, or creator can delete events"
      });
    }
    await deleteEvent(input.id);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "event_deleted",
      targetType: "event",
      targetId: input.id,
      metadata: { title: event.title }
    });
    return { success: true };
  }),
  // RSVP to an event
  rsvp: protectedProcedure.input(
    z6.object({
      eventId: z6.number(),
      status: z6.enum(["going", "declined", "maybe"])
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError7({ code: "BAD_REQUEST", message: "No household found" });
    }
    const event = await getEvent(input.eventId);
    if (!event) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Event not found" });
    }
    if (event.householdId !== ctx.user.householdId) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Event not found" });
    }
    const visibleEvents = await filterByVisibility(
      [event],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleEvents.length === 0) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Event not found" });
    }
    const isPrivileged = ctx.user.role === "primary" || ctx.user.role === "admin";
    const now = /* @__PURE__ */ new Date();
    const startAt = event.startAt ? new Date(event.startAt) : null;
    if (!isPrivileged && startAt && startAt.getTime() < now.getTime()) {
      throw new TRPCError7({
        code: "FORBIDDEN",
        message: "Cannot RSVP to past events"
      });
    }
    const rsvpId = await upsertRsvp({
      eventId: input.eventId,
      userId: ctx.user.id,
      status: input.status
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "event_rsvp",
      targetType: "event",
      targetId: input.eventId,
      metadata: { status: input.status, rsvpId }
    });
    if (input.status === "going") {
      const allMembers = await getUsersByHousehold(ctx.user.householdId);
      const adminUserIds = allMembers.filter((m) => m.role === "primary" || m.role === "admin").map((m) => m.id);
      notifyVisibleUsers(
        ctx.user.householdId,
        adminUserIds,
        "event_rsvp",
        {
          eventTitle: event.title,
          rsvperName: ctx.user.name,
          rsvpStatus: "going",
          actionUrl: `${process.env.REPL_HOME || ""}/calendar`
        },
        [ctx.user.id]
      ).catch((err) => console.error("Failed to send event_rsvp notification:", err));
    }
    return { rsvpId };
  })
});

// server/messagesRouter.ts
import { TRPCError as TRPCError8 } from "@trpc/server";
import { z as z7 } from "zod";
var messagesRouter = router({
  // List announcements for the household
  listAnnouncements: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    const announcements2 = await getAnnouncementsByHousehold(ctx.user.householdId);
    const visibleAnnouncements = await filterByVisibility(
      announcements2,
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    return visibleAnnouncements;
  }),
  // Create an announcement
  createAnnouncement: protectedProcedure.input(
    z7.object({
      title: z7.string().min(1),
      body: z7.string().min(1),
      pinned: z7.boolean().default(false),
      visibilityScope: z7.enum(["private", "all_supporters", "group", "role"]).default("all_supporters"),
      visibilityGroupIds: z7.array(z7.number()).optional(),
      mediaUrls: z7.array(z7.string()).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError8({ code: "BAD_REQUEST", message: "No household found" });
    }
    const canCreate = ctx.user.role === "primary" || ctx.user.role === "admin";
    if (!canCreate) {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "Only Primary or Admin can create announcements"
      });
    }
    const announcementId = await createAnnouncement({
      householdId: ctx.user.householdId,
      title: input.title,
      body: input.body,
      pinned: input.pinned,
      createdBy: ctx.user.id,
      visibilityScope: input.visibilityScope,
      visibilityGroupIds: input.visibilityGroupIds || null,
      mediaUrls: input.mediaUrls || null
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "announcement_created",
      targetType: "announcement",
      targetId: announcementId,
      metadata: { title: input.title, pinned: input.pinned }
    });
    const allMembers = await getUsersByHousehold(ctx.user.householdId);
    const announcement = {
      id: announcementId,
      householdId: ctx.user.householdId,
      title: input.title,
      body: input.body,
      pinned: input.pinned,
      createdBy: ctx.user.id,
      visibilityScope: input.visibilityScope,
      visibilityGroupIds: input.visibilityGroupIds || null,
      customUserIds: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    const targetUserIds = [];
    for (const member of allMembers) {
      const visibleAnnouncements = await filterByVisibility(
        [announcement],
        member.id,
        member.role,
        member.accessTier,
        ctx.user.householdId
      );
      if (visibleAnnouncements.length > 0) {
        targetUserIds.push(member.id);
      }
    }
    if (targetUserIds.length > 0) {
      notifyVisibleUsers(
        ctx.user.householdId,
        targetUserIds,
        "new_announcement",
        {
          announcementBody: input.body.substring(0, 150) + (input.body.length > 150 ? "..." : ""),
          actionUrl: `${process.env.REPL_HOME || ""}/messages`
        },
        [ctx.user.id]
      ).catch((err) => console.error("Failed to send new_announcement notification:", err));
    }
    return { announcementId };
  }),
  // Update an announcement
  updateAnnouncement: protectedProcedure.input(
    z7.object({
      id: z7.number(),
      title: z7.string().min(1).optional(),
      body: z7.string().min(1).optional(),
      pinned: z7.boolean().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError8({ code: "BAD_REQUEST", message: "No household found" });
    }
    const canUpdate = ctx.user.role === "primary" || ctx.user.role === "admin";
    if (!canUpdate) {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "Only Primary or Admin can update announcements"
      });
    }
    const { id, ...updateData } = input;
    await updateAnnouncement(id, updateData);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "announcement_updated",
      targetType: "announcement",
      targetId: id,
      metadata: updateData
    });
    return { success: true };
  }),
  // Delete an announcement
  deleteAnnouncement: protectedProcedure.input(z7.object({ id: z7.number() })).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError8({ code: "BAD_REQUEST", message: "No household found" });
    }
    const canDelete = ctx.user.role === "primary" || ctx.user.role === "admin";
    if (!canDelete) {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "Only Primary or Admin can delete announcements"
      });
    }
    await deleteAnnouncement(input.id);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "announcement_deleted",
      targetType: "announcement",
      targetId: input.id,
      metadata: {}
    });
    return { success: true };
  }),
  // Send a question to admins/primary
  sendQuestion: protectedProcedure.input(
    z7.object({
      subject: z7.string().min(1),
      message: z7.string().min(1),
      context: z7.enum(["need", "event", "meal_train", "gift_registry", "general"]).optional(),
      contextId: z7.number().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError8({ code: "BAD_REQUEST", message: "No household found" });
    }
    const allMembers = await getUsersByHousehold(ctx.user.householdId);
    const adminsAndPrimary = allMembers.filter(
      (member) => member.role === "admin" || member.role === "primary"
    );
    if (adminsAndPrimary.length === 0) {
      throw new TRPCError8({
        code: "BAD_REQUEST",
        message: "No admins or primary users found"
      });
    }
    const customUserIds = adminsAndPrimary.map((user) => user.id);
    let title = input.subject;
    if (input.context && input.contextId) {
      title = `Question about ${input.context} #${input.contextId}: ${input.subject}`;
    }
    const announcementId = await createAnnouncement({
      householdId: ctx.user.householdId,
      title,
      body: `From: ${ctx.user.firstName || "Unknown"} ${ctx.user.lastName || ""}

${input.message}`,
      pinned: false,
      createdBy: ctx.user.id,
      visibilityScope: "custom",
      visibilityGroupIds: null,
      customUserIds,
      mediaUrls: null,
      isQuestion: true,
      questionContext: input.context || null,
      questionContextId: input.contextId || null,
      readBy: []
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "question_sent",
      targetType: "announcement",
      targetId: announcementId,
      metadata: { context: input.context, contextId: input.contextId }
    });
    notifyVisibleUsers(
      ctx.user.householdId,
      customUserIds,
      "new_message",
      {
        announcementBody: input.message.substring(0, 150) + (input.message.length > 150 ? "..." : ""),
        actionUrl: `${process.env.REPL_HOME || ""}/messages`
      },
      [ctx.user.id]
    ).catch((err) => console.error("Failed to send question notification:", err));
    return { success: true, announcementId };
  }),
  // Send a direct message to specific users (admin/primary only)
  sendDirectMessage: protectedProcedure.input(
    z7.object({
      title: z7.string().min(1),
      body: z7.string().min(1),
      recipientUserIds: z7.array(z7.string()).min(1),
      mediaUrls: z7.array(z7.string()).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError8({ code: "BAD_REQUEST", message: "No household found" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "primary") {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "Only Admin or Primary can send direct messages"
      });
    }
    const allMembers = await getUsersByHousehold(ctx.user.householdId);
    const memberIds = allMembers.map((m) => m.id);
    for (const recipientId of input.recipientUserIds) {
      if (!memberIds.includes(recipientId)) {
        throw new TRPCError8({
          code: "BAD_REQUEST",
          message: `Recipient ${recipientId} is not in your household`
        });
      }
    }
    const announcementId = await createAnnouncement({
      householdId: ctx.user.householdId,
      title: input.title,
      body: input.body,
      pinned: false,
      createdBy: ctx.user.id,
      visibilityScope: "custom",
      visibilityGroupIds: null,
      customUserIds: input.recipientUserIds,
      mediaUrls: input.mediaUrls || null
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "direct_message_sent",
      targetType: "announcement",
      targetId: announcementId,
      metadata: { recipientCount: input.recipientUserIds.length }
    });
    notifyVisibleUsers(
      ctx.user.householdId,
      input.recipientUserIds,
      "new_message",
      {
        announcementBody: input.body.substring(0, 150) + (input.body.length > 150 ? "..." : ""),
        actionUrl: `${process.env.REPL_HOME || ""}/messages`
      },
      [ctx.user.id]
    ).catch((err) => console.error("Failed to send direct message notification:", err));
    return { success: true, announcementId };
  }),
  // List all questions for admins/primary
  listQuestions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError8({ code: "BAD_REQUEST", message: "No household found" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "primary") {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "Only Admin or Primary can view questions"
      });
    }
    const questions = await getQuestionsByHousehold(ctx.user.householdId);
    const questionsWithDetails = await Promise.all(
      questions.map(async (q) => {
        const author = await getUserById(q.createdBy);
        const replies = await getQuestionReplies(q.id);
        return {
          ...q,
          authorName: author ? `${author.firstName || ""} ${author.lastName || ""}`.trim() : "Unknown",
          authorEmail: author?.email,
          replyCount: replies.length,
          isUnread: !q.readBy?.includes(ctx.user.id)
        };
      })
    );
    return questionsWithDetails;
  }),
  // Mark a question as read
  markQuestionAsRead: protectedProcedure.input(z7.object({ questionId: z7.number() })).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError8({ code: "BAD_REQUEST", message: "No household found" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "primary") {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "Only Admin or Primary can mark questions as read"
      });
    }
    await markQuestionAsRead(input.questionId, ctx.user.id);
    return { success: true };
  }),
  // Reply to a question
  replyToQuestion: protectedProcedure.input(z7.object({
    questionId: z7.number(),
    message: z7.string().min(1)
  })).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError8({ code: "BAD_REQUEST", message: "No household found" });
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "primary") {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "Only Admin or Primary can reply to questions"
      });
    }
    const replyId = await createQuestionReply({
      questionId: input.questionId,
      householdId: ctx.user.householdId,
      authorId: ctx.user.id,
      message: input.message
    });
    await markQuestionAsRead(input.questionId, ctx.user.id);
    const questions = await getAnnouncementsByHousehold(ctx.user.householdId);
    const question = questions.find((q) => q.id === input.questionId);
    if (question) {
      notifyVisibleUsers(
        ctx.user.householdId,
        [question.createdBy],
        "new_message",
        {
          announcementBody: `Reply to your question: ${input.message.substring(0, 150)}${input.message.length > 150 ? "..." : ""}`,
          actionUrl: `${process.env.REPL_HOME || ""}/questions`
        },
        [ctx.user.id]
      ).catch((err) => console.error("Failed to send reply notification:", err));
    }
    return { success: true, replyId };
  }),
  // Get replies for a question
  getQuestionReplies: protectedProcedure.input(z7.object({ questionId: z7.number() })).query(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError8({ code: "BAD_REQUEST", message: "No household found" });
    }
    const replies = await getQuestionReplies(input.questionId);
    const repliesWithAuthor = await Promise.all(
      replies.map(async (r) => {
        const author = await getUserById(r.authorId);
        return {
          ...r,
          authorName: author ? `${author.firstName || ""} ${author.lastName || ""}`.trim() : "Unknown",
          authorRole: author?.role
        };
      })
    );
    return repliesWithAuthor;
  }),
  // Get unread question count
  getUnreadQuestionCount: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return 0;
    }
    if (ctx.user.role !== "admin" && ctx.user.role !== "primary") {
      return 0;
    }
    return await getUnreadQuestionCount(ctx.user.householdId, ctx.user.id);
  })
});

// server/mealTrainRouter.ts
import { TRPCError as TRPCError9 } from "@trpc/server";
import { z as z8 } from "zod";
var mealTrainRouter = router({
  // Get the meal train configuration for the household
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return null;
    }
    const mealTrain = await getMealTrainByHousehold(ctx.user.householdId);
    if (!mealTrain) {
      return null;
    }
    const visibleMealTrains = await filterByVisibility(
      [mealTrain],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleMealTrains.length === 0) {
      return null;
    }
    return visibleMealTrains[0];
  }),
  // Get all meal signups for the household's meal train
  listSignups: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    const mealTrain = await getMealTrainByHousehold(ctx.user.householdId);
    if (!mealTrain) {
      return [];
    }
    const visibleMealTrains = await filterByVisibility(
      [mealTrain],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleMealTrains.length === 0) {
      throw new TRPCError9({
        code: "FORBIDDEN",
        message: "You do not have permission to view this meal train"
      });
    }
    return await getMealSignupsByMealTrain(mealTrain.id);
  }),
  // Get meal signups for the current user
  listUserSignups: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    const mealTrain = await getMealTrainByHousehold(ctx.user.householdId);
    if (!mealTrain) {
      return [];
    }
    const visibleMealTrains = await filterByVisibility(
      [mealTrain],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleMealTrains.length === 0) {
      return [];
    }
    const allSignups = await getMealSignupsByMealTrain(mealTrain.id);
    return allSignups.filter((signup) => signup.userId === ctx.user.id);
  }),
  // Get meal train days
  getDays: protectedProcedure.input(z8.object({ mealTrainId: z8.number() })).query(async ({ input }) => {
    return await getMealTrainDays(input.mealTrainId);
  }),
  // Create or update meal train configuration (admin/primary only)
  upsert: protectedProcedure.input(
    z8.object({
      location: z8.string().optional(),
      peopleCount: z8.number().optional(),
      favoriteMeals: z8.string().optional(),
      allergies: z8.string().optional(),
      dislikes: z8.string().optional(),
      specialInstructions: z8.string().optional(),
      dailyCapacity: z8.number().min(1).max(10).default(1),
      visibilityScope: z8.enum(["private", "all_supporters", "group", "role", "custom"]).default("all_supporters"),
      visibilityGroupIds: z8.array(z8.number()).optional(),
      customUserIds: z8.array(z8.string()).optional(),
      includeCommunityTier: z8.boolean().default(false),
      enabled: z8.boolean().default(true),
      daysAheadOpen: z8.number().min(1).max(365).optional(),
      availabilityStartDate: z8.string().optional(),
      availabilityEndDate: z8.string().optional(),
      selectedDates: z8.array(z8.string()).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "No household found" });
    }
    const canConfigure = ctx.user.role === "primary" || ctx.user.role === "admin";
    if (!canConfigure) {
      throw new TRPCError9({
        code: "FORBIDDEN",
        message: "Only Primary or Admin can configure meal train"
      });
    }
    const existingMealTrain = await getMealTrainByHousehold(ctx.user.householdId);
    let mealTrainId;
    if (existingMealTrain) {
      await updateMealTrain(existingMealTrain.id, {
        location: input.location || null,
        peopleCount: input.peopleCount || null,
        favoriteMeals: input.favoriteMeals || null,
        allergies: input.allergies || null,
        dislikes: input.dislikes || null,
        specialInstructions: input.specialInstructions || null,
        dailyCapacity: input.dailyCapacity,
        visibilityScope: input.visibilityScope,
        visibilityGroupIds: input.visibilityGroupIds || null,
        customUserIds: input.customUserIds || null,
        includeCommunityTier: input.includeCommunityTier,
        enabled: input.enabled,
        daysAheadOpen: input.daysAheadOpen || null,
        availabilityStartDate: input.availabilityStartDate || null,
        availabilityEndDate: input.availabilityEndDate || null
      });
      mealTrainId = existingMealTrain.id;
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "meal_train_updated",
        targetType: "meal_train",
        targetId: existingMealTrain.id,
        metadata: input
      });
    } else {
      mealTrainId = await createMealTrain({
        householdId: ctx.user.householdId,
        location: input.location || null,
        peopleCount: input.peopleCount || null,
        favoriteMeals: input.favoriteMeals || null,
        allergies: input.allergies || null,
        dislikes: input.dislikes || null,
        specialInstructions: input.specialInstructions || null,
        dailyCapacity: input.dailyCapacity,
        visibilityScope: input.visibilityScope,
        visibilityGroupIds: input.visibilityGroupIds || null,
        customUserIds: input.customUserIds || null,
        includeCommunityTier: input.includeCommunityTier,
        enabled: input.enabled,
        daysAheadOpen: input.daysAheadOpen || null,
        availabilityStartDate: input.availabilityStartDate || null,
        availabilityEndDate: input.availabilityEndDate || null,
        createdBy: ctx.user.id
      });
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "meal_train_created",
        targetType: "meal_train",
        targetId: mealTrainId,
        metadata: input
      });
    }
    if (input.selectedDates && input.selectedDates.length > 0) {
      const dates = input.selectedDates.map((d) => new Date(d));
      await saveMealTrainDays(mealTrainId, dates);
    }
    return { mealTrainId };
  }),
  // Volunteer to deliver a meal on a specific date
  volunteer: protectedProcedure.input(
    z8.object({
      deliveryDate: z8.date(),
      notes: z8.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "No household found" });
    }
    const mealTrain = await getMealTrainByHousehold(ctx.user.householdId);
    if (!mealTrain) {
      throw new TRPCError9({ code: "NOT_FOUND", message: "Meal train not configured" });
    }
    const visibleMealTrains = await filterByVisibility(
      [mealTrain],
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );
    if (visibleMealTrains.length === 0) {
      throw new TRPCError9({
        code: "FORBIDDEN",
        message: "You do not have permission to volunteer for this meal train"
      });
    }
    if (!mealTrain.enabled) {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "Meal train is not currently active" });
    }
    const dateString = input.deliveryDate.toISOString().split("T")[0];
    const isAvailable = await isMealDayAvailable(mealTrain.id, dateString);
    if (!isAvailable) {
      throw new TRPCError9({
        code: "BAD_REQUEST",
        message: "This day is not available for meal signups"
      });
    }
    const existingSignups = await getMealSignupsByMealTrain(mealTrain.id);
    const signupsForDate = existingSignups.filter((s) => {
      const signupDate = new Date(s.deliveryDate);
      const targetDate = new Date(input.deliveryDate);
      return signupDate.getFullYear() === targetDate.getFullYear() && signupDate.getMonth() === targetDate.getMonth() && signupDate.getDate() === targetDate.getDate() && s.status !== "cancelled";
    });
    const dailyCapacity = mealTrain.dailyCapacity || 1;
    if (signupsForDate.length >= dailyCapacity) {
      throw new TRPCError9({
        code: "BAD_REQUEST",
        message: `This date is full. Maximum ${dailyCapacity} volunteer(s) per day.`
      });
    }
    const signupId = await createMealSignup({
      mealTrainId: mealTrain.id,
      userId: ctx.user.id,
      deliveryDate: input.deliveryDate,
      status: "confirmed",
      notes: input.notes || null
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "meal_signup_created",
      targetType: "meal_signup",
      targetId: signupId,
      metadata: { deliveryDate: input.deliveryDate }
    });
    const allMembers = await getUsersByHousehold(ctx.user.householdId);
    const adminUserIds = allMembers.filter((m) => m.role === "primary" || m.role === "admin").map((m) => m.id);
    notifyVisibleUsers(
      ctx.user.householdId,
      adminUserIds,
      "meal_train_signup",
      {
        volunteerName: ctx.user.name,
        mealDate: input.deliveryDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }),
        volunteerNote: input.notes || "No special notes provided.",
        actionUrl: `${process.env.REPL_HOME || ""}/meal-train`
      },
      [ctx.user.id]
    ).catch((err) => console.error("Failed to send meal_train_signup notification:", err));
    return { signupId };
  }),
  // Update a meal signup (change notes or mark as completed)
  updateSignup: protectedProcedure.input(
    z8.object({
      id: z8.number(),
      notes: z8.string().optional(),
      status: z8.enum(["pending", "confirmed", "completed", "cancelled"]).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "No household found" });
    }
    const signup = await getMealSignup(input.id);
    if (!signup) {
      throw new TRPCError9({ code: "NOT_FOUND", message: "Signup not found" });
    }
    const canUpdate = signup.userId === ctx.user.id || ctx.user.role === "primary" || ctx.user.role === "admin";
    if (!canUpdate) {
      throw new TRPCError9({
        code: "FORBIDDEN",
        message: "Only the volunteer or admin can update this signup"
      });
    }
    const { id, ...updateData } = input;
    await updateMealSignup(id, {
      ...updateData,
      completedAt: input.status === "completed" ? /* @__PURE__ */ new Date() : void 0
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "meal_signup_updated",
      targetType: "meal_signup",
      targetId: id,
      metadata: updateData
    });
    return { success: true };
  }),
  // Cancel a meal signup
  cancelSignup: protectedProcedure.input(z8.object({ id: z8.number() })).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "No household found" });
    }
    const signup = await getMealSignup(input.id);
    if (!signup) {
      throw new TRPCError9({ code: "NOT_FOUND", message: "Signup not found" });
    }
    const canCancel = signup.userId === ctx.user.id || ctx.user.role === "primary" || ctx.user.role === "admin";
    if (!canCancel) {
      throw new TRPCError9({
        code: "FORBIDDEN",
        message: "Only the volunteer or admin can cancel this signup"
      });
    }
    await deleteMealSignup(input.id);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "meal_signup_cancelled",
      targetType: "meal_signup",
      targetId: input.id,
      metadata: null
    });
    const allMembers = await getUsersByHousehold(ctx.user.householdId);
    const adminUserIds = allMembers.filter((m) => m.role === "primary" || m.role === "admin").map((m) => m.id);
    notifyVisibleUsers(
      ctx.user.householdId,
      adminUserIds,
      "meal_train_cancelled",
      {
        volunteerName: ctx.user.name,
        mealDate: signup.deliveryDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }),
        actionUrl: `${process.env.REPL_HOME || ""}/meal-train`
      },
      [ctx.user.id]
    ).catch((err) => console.error("Failed to send meal_train_cancelled notification:", err));
    return { success: true };
  })
});

// server/notificationRouter.ts
import { z as z9 } from "zod";
import { TRPCError as TRPCError10 } from "@trpc/server";
import { eq as eq4, and as and4 } from "drizzle-orm";
var notificationRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError10({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const prefs = await db.select().from(notificationPreferences).where(
      and4(
        eq4(notificationPreferences.userId, ctx.user.id),
        eq4(notificationPreferences.householdId, ctx.user.householdId)
      )
    ).limit(1);
    if (prefs.length === 0) {
      const isAdminOrPrimary = ctx.user.role === "admin" || ctx.user.role === "primary";
      const defaultPrefs = await db.insert(notificationPreferences).values({
        userId: ctx.user.id,
        householdId: ctx.user.householdId,
        emailNeedUnclaimed: isAdminOrPrimary,
        emailEnabled: isAdminOrPrimary
      }).returning();
      return defaultPrefs[0];
    }
    return prefs[0];
  }),
  updatePreferences: protectedProcedure.input(
    z9.object({
      emailEnabled: z9.boolean().optional(),
      emailNeedCreated: z9.boolean().optional(),
      emailNeedClaimed: z9.boolean().optional(),
      emailNeedUnclaimed: z9.boolean().optional(),
      emailNeedCompleted: z9.boolean().optional(),
      emailEventCreated: z9.boolean().optional(),
      emailEventRsvp: z9.boolean().optional(),
      emailMealTrainSignup: z9.boolean().optional(),
      emailMealTrainCancelled: z9.boolean().optional(),
      emailNewMessage: z9.boolean().optional(),
      emailNewAnnouncement: z9.boolean().optional(),
      emailNewUpdate: z9.boolean().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError10({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const existing = await db.select().from(notificationPreferences).where(
      and4(
        eq4(notificationPreferences.userId, ctx.user.id),
        eq4(notificationPreferences.householdId, ctx.user.householdId)
      )
    ).limit(1);
    if (existing.length === 0) {
      const isAdminOrPrimary = ctx.user.role === "admin" || ctx.user.role === "primary";
      const created = await db.insert(notificationPreferences).values({
        userId: ctx.user.id,
        householdId: ctx.user.householdId,
        emailNeedUnclaimed: isAdminOrPrimary,
        emailEnabled: input.emailEnabled !== void 0 ? input.emailEnabled : isAdminOrPrimary,
        ...input
      }).returning();
      return created[0];
    }
    const updated = await db.update(notificationPreferences).set({
      ...input,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(
      and4(
        eq4(notificationPreferences.userId, ctx.user.id),
        eq4(notificationPreferences.householdId, ctx.user.householdId)
      )
    ).returning();
    return updated[0];
  })
});

// server/memoryWallRouter.ts
import { TRPCError as TRPCError11 } from "@trpc/server";
import { z as z10 } from "zod";
var memoryWallRouter = router({
  // Create memory wall entry
  create: protectedProcedure.input(
    z10.object({
      type: z10.enum(["memory", "story", "encouragement", "prayer", "picture"]),
      content: z10.string().optional(),
      imageUrl: z10.string().optional(),
      imageUrls: z10.array(z10.string()).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError11({ code: "BAD_REQUEST", message: "No household found" });
    }
    if (input.type === "picture" && !input.imageUrl && (!input.imageUrls || input.imageUrls.length === 0)) {
      throw new TRPCError11({ code: "BAD_REQUEST", message: "Picture entries must have at least one image" });
    }
    if (input.type !== "picture" && !input.content) {
      throw new TRPCError11({ code: "BAD_REQUEST", message: "This entry type requires content" });
    }
    const entryId = await createMemoryWallEntry({
      householdId: ctx.user.householdId,
      authorId: ctx.user.id,
      type: input.type,
      content: input.content || null,
      imageUrl: input.imageUrl || null,
      imageUrls: input.imageUrls || null
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "memory_wall_created",
      targetType: "memory_wall",
      targetId: entryId,
      metadata: { type: input.type }
    });
    return { success: true, entryId };
  }),
  // List memory wall entries with optional type filter
  list: protectedProcedure.input(
    z10.object({
      type: z10.enum(["memory", "story", "encouragement", "prayer", "picture"]).optional()
    }).optional()
  ).query(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    return await getMemoryWallEntries(ctx.user.householdId, input?.type);
  }),
  // Delete memory wall entry
  delete: protectedProcedure.input(
    z10.object({
      entryId: z10.number()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError11({ code: "BAD_REQUEST", message: "No household found" });
    }
    const entry = await getMemoryWallEntry(input.entryId);
    if (!entry) {
      throw new TRPCError11({ code: "NOT_FOUND", message: "Entry not found" });
    }
    if (entry.householdId !== ctx.user.householdId) {
      throw new TRPCError11({ code: "FORBIDDEN", message: "Entry belongs to different household" });
    }
    if (entry.authorId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "primary") {
      throw new TRPCError11({ code: "FORBIDDEN", message: "Only the author, admin, or primary can delete" });
    }
    await deleteMemoryWallEntry(input.entryId);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "memory_wall_deleted",
      targetType: "memory_wall",
      targetId: input.entryId
    });
    return { success: true };
  }),
  // Update memory wall entry
  update: protectedProcedure.input(
    z10.object({
      entryId: z10.number(),
      type: z10.enum(["memory", "story", "encouragement", "prayer", "picture"]).optional(),
      content: z10.string().optional(),
      imageUrl: z10.string().optional(),
      imageUrls: z10.array(z10.string()).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError11({ code: "BAD_REQUEST", message: "No household found" });
    }
    const entry = await getMemoryWallEntry(input.entryId);
    if (!entry) {
      throw new TRPCError11({ code: "NOT_FOUND", message: "Entry not found" });
    }
    if (entry.householdId !== ctx.user.householdId) {
      throw new TRPCError11({ code: "FORBIDDEN", message: "Entry belongs to different household" });
    }
    if (entry.authorId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "primary") {
      throw new TRPCError11({ code: "FORBIDDEN", message: "Only the author, admin, or primary can edit" });
    }
    const newType = input.type || entry.type;
    const finalImageUrl = input.imageUrl !== void 0 ? input.imageUrl : entry.imageUrl;
    const finalImageUrls = input.imageUrls !== void 0 ? input.imageUrls : entry.imageUrls;
    const finalContent = input.content !== void 0 ? input.content : entry.content;
    if (newType === "picture" && !finalImageUrl && (!finalImageUrls || finalImageUrls.length === 0)) {
      throw new TRPCError11({ code: "BAD_REQUEST", message: "Picture entries must have at least one image" });
    }
    if (newType !== "picture" && (!finalContent || finalContent.trim() === "")) {
      throw new TRPCError11({ code: "BAD_REQUEST", message: "This entry type requires content" });
    }
    await updateMemoryWallEntry(input.entryId, {
      type: input.type,
      content: input.content,
      imageUrl: input.imageUrl,
      imageUrls: input.imageUrls
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "memory_wall_updated",
      targetType: "memory_wall",
      targetId: input.entryId,
      metadata: { type: newType }
    });
    return { success: true };
  }),
  // Get user-specific positions for memory wall cards
  getPositions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    return await getMemoryWallPositions(ctx.user.id, ctx.user.householdId);
  }),
  // Save/update position for a memory wall card
  savePosition: protectedProcedure.input(
    z10.object({
      memoryId: z10.number(),
      x: z10.number(),
      y: z10.number(),
      rotation: z10.number().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      if (!ctx.user.householdId) {
        throw new TRPCError11({ code: "BAD_REQUEST", message: "No household found" });
      }
      console.log("[MemoryWall] Saving position:", {
        userId: ctx.user.id,
        householdId: ctx.user.householdId,
        memoryId: input.memoryId,
        x: input.x,
        y: input.y,
        rotation: input.rotation || 0
      });
      await saveMemoryWallPosition({
        userId: ctx.user.id,
        householdId: ctx.user.householdId,
        memoryId: input.memoryId,
        x: input.x,
        y: input.y,
        rotation: input.rotation || 0
      });
      console.log("[MemoryWall] Position saved successfully");
      return { success: true };
    } catch (error) {
      console.error("[MemoryWall] Error saving position:", error);
      throw new TRPCError11({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to save position: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  })
});

// server/giftRegistryRouter.ts
import { TRPCError as TRPCError12 } from "@trpc/server";
import { z as z11 } from "zod";
var giftRegistryRouter = router({
  // Create gift registry item
  create: protectedProcedure.input(
    z11.object({
      name: z11.string().min(1),
      description: z11.string().optional(),
      url: z11.string().optional(),
      imageUrl: z11.string().optional(),
      price: z11.string().optional(),
      priority: z11.enum(["low", "normal", "urgent"]).default("normal"),
      notes: z11.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError12({ code: "BAD_REQUEST", message: "No household found" });
    }
    if (ctx.user.role !== "primary" && ctx.user.role !== "admin") {
      throw new TRPCError12({
        code: "FORBIDDEN",
        message: "Only Primary or Admin can add items to gift registry"
      });
    }
    const itemId = await createGiftRegistryItem({
      householdId: ctx.user.householdId,
      name: input.name,
      description: input.description || null,
      url: input.url || null,
      imageUrl: input.imageUrl || null,
      price: input.price || null,
      priority: input.priority,
      status: "needed",
      notes: input.notes || null
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "gift_registry_created",
      targetType: "gift_registry",
      targetId: itemId,
      metadata: { name: input.name, priority: input.priority }
    });
    return { success: true, itemId };
  }),
  // List gift registry items
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    return await getGiftRegistryItems(ctx.user.householdId);
  }),
  // Update gift registry item
  update: protectedProcedure.input(
    z11.object({
      itemId: z11.number(),
      name: z11.string().min(1).optional(),
      description: z11.string().optional(),
      url: z11.string().optional(),
      imageUrl: z11.string().optional(),
      price: z11.string().optional(),
      priority: z11.enum(["low", "normal", "urgent"]).optional(),
      notes: z11.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError12({ code: "BAD_REQUEST", message: "No household found" });
    }
    const item = await getGiftRegistryItem(input.itemId);
    if (!item) {
      throw new TRPCError12({ code: "NOT_FOUND", message: "Item not found" });
    }
    if (item.householdId !== ctx.user.householdId) {
      throw new TRPCError12({ code: "FORBIDDEN", message: "Item belongs to different household" });
    }
    if (ctx.user.role !== "primary" && ctx.user.role !== "admin") {
      throw new TRPCError12({ code: "FORBIDDEN", message: "Only Primary or Admin can update items" });
    }
    await updateGiftRegistryItem(input.itemId, {
      name: input.name,
      description: input.description,
      url: input.url,
      imageUrl: input.imageUrl,
      price: input.price,
      priority: input.priority,
      notes: input.notes
    });
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "gift_registry_updated",
      targetType: "gift_registry",
      targetId: input.itemId
    });
    return { success: true };
  }),
  // Mark as purchased
  markPurchased: protectedProcedure.input(
    z11.object({
      itemId: z11.number()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError12({ code: "BAD_REQUEST", message: "No household found" });
    }
    const item = await getGiftRegistryItem(input.itemId);
    if (!item) {
      throw new TRPCError12({ code: "NOT_FOUND", message: "Item not found" });
    }
    if (item.householdId !== ctx.user.householdId) {
      throw new TRPCError12({ code: "FORBIDDEN", message: "Item belongs to different household" });
    }
    await markGiftPurchased(input.itemId, ctx.user.id);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "gift_purchased",
      targetType: "gift_registry",
      targetId: input.itemId
    });
    return { success: true };
  }),
  // Mark as received
  markReceived: protectedProcedure.input(
    z11.object({
      itemId: z11.number()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError12({ code: "BAD_REQUEST", message: "No household found" });
    }
    const item = await getGiftRegistryItem(input.itemId);
    if (!item) {
      throw new TRPCError12({ code: "NOT_FOUND", message: "Item not found" });
    }
    if (item.householdId !== ctx.user.householdId) {
      throw new TRPCError12({ code: "FORBIDDEN", message: "Item belongs to different household" });
    }
    if (ctx.user.role !== "primary" && ctx.user.role !== "admin") {
      throw new TRPCError12({ code: "FORBIDDEN", message: "Only Primary or Admin can mark items as received" });
    }
    await markGiftReceived(input.itemId);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "gift_received",
      targetType: "gift_registry",
      targetId: input.itemId
    });
    return { success: true };
  }),
  // Delete gift registry item
  delete: protectedProcedure.input(
    z11.object({
      itemId: z11.number()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user.householdId) {
      throw new TRPCError12({ code: "BAD_REQUEST", message: "No household found" });
    }
    const item = await getGiftRegistryItem(input.itemId);
    if (!item) {
      throw new TRPCError12({ code: "NOT_FOUND", message: "Item not found" });
    }
    if (item.householdId !== ctx.user.householdId) {
      throw new TRPCError12({ code: "FORBIDDEN", message: "Item belongs to different household" });
    }
    if (ctx.user.role !== "primary" && ctx.user.role !== "admin") {
      throw new TRPCError12({ code: "FORBIDDEN", message: "Only Primary or Admin can delete items" });
    }
    await deleteGiftRegistryItem(input.itemId);
    await createAuditLog({
      householdId: ctx.user.householdId,
      actorUserId: ctx.user.id,
      action: "gift_registry_deleted",
      targetType: "gift_registry",
      targetId: input.itemId
    });
    return { success: true };
  })
});

// server/reminderRouter.ts
import { z as z12 } from "zod";
import { TRPCError as TRPCError13 } from "@trpc/server";
import { eq as eq5, and as and5 } from "drizzle-orm";
var reminderRouter = router({
  // Create a personal reminder (standalone, not tied to need/event)
  createPersonal: protectedProcedure.input(
    z12.object({
      title: z12.string().min(1, "Title is required"),
      description: z12.string().optional(),
      triggerAt: z12.string()
      // ISO date string
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError13({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError13({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const triggerDate = new Date(input.triggerAt);
    if (triggerDate < /* @__PURE__ */ new Date()) {
      throw new TRPCError13({
        code: "BAD_REQUEST",
        message: "Reminder time must be in the future"
      });
    }
    const reminder = await db.insert(reminders).values({
      userId: ctx.user.id,
      householdId: ctx.user.householdId,
      targetType: "personal",
      targetId: null,
      reminderOffsetMinutes: null,
      triggerAt: triggerDate,
      title: input.title,
      description: input.description || null,
      status: "queued"
    }).returning();
    return reminder[0];
  }),
  // Create a new reminder
  create: protectedProcedure.input(
    z12.object({
      targetType: z12.enum(["need", "event"]),
      targetId: z12.number(),
      reminderOffsetMinutes: z12.number().min(1)
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError13({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError13({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const household = await db.select().from(households).where(eq5(households.id, ctx.user.householdId)).limit(1);
    if (household.length === 0) {
      throw new TRPCError13({ code: "NOT_FOUND", message: "Household not found" });
    }
    let targetDate = null;
    if (input.targetType === "need") {
      const need = await db.select().from(needs).where(eq5(needs.id, input.targetId)).limit(1);
      if (need.length === 0 || need[0].householdId !== ctx.user.householdId) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Need not found" });
      }
      targetDate = need[0].dueAt;
    } else {
      const event = await db.select().from(events).where(eq5(events.id, input.targetId)).limit(1);
      if (event.length === 0 || event[0].householdId !== ctx.user.householdId) {
        throw new TRPCError13({ code: "NOT_FOUND", message: "Event not found" });
      }
      targetDate = event[0].startAt;
    }
    if (!targetDate) {
      throw new TRPCError13({
        code: "BAD_REQUEST",
        message: `Cannot set reminder: ${input.targetType} has no date/time`
      });
    }
    const triggerAt = new Date(targetDate.getTime() - input.reminderOffsetMinutes * 60 * 1e3);
    if (triggerAt < /* @__PURE__ */ new Date()) {
      throw new TRPCError13({
        code: "BAD_REQUEST",
        message: "Cannot set reminder: trigger time would be in the past"
      });
    }
    const reminder = await db.insert(reminders).values({
      userId: ctx.user.id,
      householdId: ctx.user.householdId,
      targetType: input.targetType,
      targetId: input.targetId,
      reminderOffsetMinutes: input.reminderOffsetMinutes,
      triggerAt,
      status: "queued"
    }).returning();
    return reminder[0];
  }),
  // List all reminders for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError13({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError13({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const userReminders = await db.select().from(reminders).where(
      and5(
        eq5(reminders.userId, ctx.user.id),
        eq5(reminders.householdId, ctx.user.householdId)
      )
    ).orderBy(reminders.triggerAt);
    return userReminders;
  }),
  // Get reminders for a specific target (need or event)
  listByTarget: protectedProcedure.input(
    z12.object({
      targetType: z12.enum(["need", "event"]),
      targetId: z12.number()
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError13({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError13({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const targetReminders = await db.select().from(reminders).where(
      and5(
        eq5(reminders.userId, ctx.user.id),
        eq5(reminders.householdId, ctx.user.householdId),
        eq5(reminders.targetType, input.targetType),
        eq5(reminders.targetId, input.targetId)
      )
    );
    return targetReminders;
  }),
  // Delete a reminder
  delete: protectedProcedure.input(z12.object({ id: z12.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError13({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError13({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const reminder = await db.select().from(reminders).where(eq5(reminders.id, input.id)).limit(1);
    if (reminder.length === 0) {
      throw new TRPCError13({ code: "NOT_FOUND", message: "Reminder not found" });
    }
    if (reminder[0].userId !== ctx.user.id) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "You can only delete your own reminders" });
    }
    await db.update(reminders).set({ status: "cancelled", updatedAt: /* @__PURE__ */ new Date() }).where(eq5(reminders.id, input.id));
    return { success: true };
  })
});

// server/onboardingRouter.ts
import { z as z13 } from "zod";
import { TRPCError as TRPCError14 } from "@trpc/server";
import { eq as eq6, and as and6, sql as sql2 } from "drizzle-orm";
async function validateTourAccess(db, tourId, userRole) {
  if (!db) {
    throw new TRPCError14({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  }
  const tour = await db.select().from(onboardingTours).where(eq6(onboardingTours.id, tourId)).limit(1);
  if (tour.length === 0) {
    throw new TRPCError14({
      code: "NOT_FOUND",
      message: "Tour not found"
    });
  }
  if (!tour[0].isActive) {
    throw new TRPCError14({
      code: "BAD_REQUEST",
      message: "Tour is not active"
    });
  }
  const roleAccess = tour[0].roleAccess;
  if (!roleAccess.includes(userRole)) {
    throw new TRPCError14({
      code: "FORBIDDEN",
      message: "You do not have access to this tour"
    });
  }
}
var onboardingRouter = router({
  listAvailableTours: protectedProcedure.input(
    z13.object({
      scope: z13.enum(["household", "feature", "help"]).optional()
    }).optional()
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError14({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError14({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const userRole = ctx.user.role || "supporter";
    const conditions = [
      eq6(onboardingTours.isActive, true),
      sql2`${onboardingTours.roleAccess} @> ${sql2.raw(`'["${userRole}"]'::jsonb`)}`
    ];
    if (input?.scope) {
      conditions.push(eq6(onboardingTours.scope, input.scope));
    }
    const tours = await db.select().from(onboardingTours).where(and6(...conditions));
    const progressRecords = await db.select().from(userTourProgress).where(
      and6(
        eq6(userTourProgress.userId, ctx.user.id),
        eq6(userTourProgress.householdId, ctx.user.householdId)
      )
    );
    const progressMap = new Map(
      progressRecords.map((p) => [p.tourId, p])
    );
    const toursWithProgress = tours.map((tour) => ({
      ...tour,
      progress: progressMap.get(tour.id) || null
    }));
    return toursWithProgress;
  }),
  getProgress: protectedProcedure.input(
    z13.object({
      tourId: z13.number()
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError14({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError14({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const userRole = ctx.user.role || "supporter";
    await validateTourAccess(db, input.tourId, userRole);
    const progress = await db.select().from(userTourProgress).where(
      and6(
        eq6(userTourProgress.userId, ctx.user.id),
        eq6(userTourProgress.householdId, ctx.user.householdId),
        eq6(userTourProgress.tourId, input.tourId)
      )
    ).limit(1);
    return progress[0] || null;
  }),
  updateProgress: protectedProcedure.input(
    z13.object({
      tourId: z13.number(),
      lastStep: z13.number().min(0),
      status: z13.enum(["not_started", "in_progress", "completed", "dismissed"]).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError14({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError14({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const userRole = ctx.user.role || "supporter";
    await validateTourAccess(db, input.tourId, userRole);
    const existingProgress = await db.select().from(userTourProgress).where(
      and6(
        eq6(userTourProgress.userId, ctx.user.id),
        eq6(userTourProgress.householdId, ctx.user.householdId),
        eq6(userTourProgress.tourId, input.tourId)
      )
    ).limit(1);
    if (existingProgress.length > 0) {
      const updated = await db.update(userTourProgress).set({
        lastStep: input.lastStep,
        status: input.status || "in_progress",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq6(userTourProgress.id, existingProgress[0].id)).returning();
      return updated[0];
    } else {
      const created = await db.insert(userTourProgress).values({
        userId: ctx.user.id,
        householdId: ctx.user.householdId,
        tourId: input.tourId,
        lastStep: input.lastStep,
        status: input.status || "in_progress"
      }).returning();
      return created[0];
    }
  }),
  completeTour: protectedProcedure.input(
    z13.object({
      tourId: z13.number()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError14({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError14({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const userRole = ctx.user.role || "supporter";
    await validateTourAccess(db, input.tourId, userRole);
    const existingProgress = await db.select().from(userTourProgress).where(
      and6(
        eq6(userTourProgress.userId, ctx.user.id),
        eq6(userTourProgress.householdId, ctx.user.householdId),
        eq6(userTourProgress.tourId, input.tourId)
      )
    ).limit(1);
    if (existingProgress.length > 0) {
      const updated = await db.update(userTourProgress).set({
        status: "completed",
        completedAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq6(userTourProgress.id, existingProgress[0].id)).returning();
      return updated[0];
    } else {
      const created = await db.insert(userTourProgress).values({
        userId: ctx.user.id,
        householdId: ctx.user.householdId,
        tourId: input.tourId,
        status: "completed",
        completedAt: /* @__PURE__ */ new Date()
      }).returning();
      return created[0];
    }
  }),
  dismissTour: protectedProcedure.input(
    z13.object({
      tourId: z13.number()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError14({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError14({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const userRole = ctx.user.role || "supporter";
    await validateTourAccess(db, input.tourId, userRole);
    const existingProgress = await db.select().from(userTourProgress).where(
      and6(
        eq6(userTourProgress.userId, ctx.user.id),
        eq6(userTourProgress.householdId, ctx.user.householdId),
        eq6(userTourProgress.tourId, input.tourId)
      )
    ).limit(1);
    if (existingProgress.length > 0) {
      const updated = await db.update(userTourProgress).set({
        status: "dismissed",
        dismissedAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq6(userTourProgress.id, existingProgress[0].id)).returning();
      return updated[0];
    } else {
      const created = await db.insert(userTourProgress).values({
        userId: ctx.user.id,
        householdId: ctx.user.householdId,
        tourId: input.tourId,
        status: "dismissed",
        dismissedAt: /* @__PURE__ */ new Date()
      }).returning();
      return created[0];
    }
  }),
  resetTour: protectedProcedure.input(
    z13.object({
      tourId: z13.number()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError14({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    if (!ctx.user.householdId) {
      throw new TRPCError14({ code: "BAD_REQUEST", message: "User not in household" });
    }
    const userRole = ctx.user.role || "supporter";
    await validateTourAccess(db, input.tourId, userRole);
    const existingProgress = await db.select().from(userTourProgress).where(
      and6(
        eq6(userTourProgress.userId, ctx.user.id),
        eq6(userTourProgress.householdId, ctx.user.householdId),
        eq6(userTourProgress.tourId, input.tourId)
      )
    ).limit(1);
    if (existingProgress.length > 0) {
      const updated = await db.update(userTourProgress).set({
        status: "not_started",
        lastStep: 0,
        completedAt: null,
        dismissedAt: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq6(userTourProgress.id, existingProgress[0].id)).returning();
      return updated[0];
    }
    return null;
  })
});

// server/supportRouter.ts
import { z as z14 } from "zod";
import { Resend as Resend4 } from "resend";
import { TRPCError as TRPCError15 } from "@trpc/server";
var SUPPORT_EMAIL = "caleb@txpressurewash.com";
var FROM_EMAIL4 = "Our Brother's Keeper <notifications@obkapp.com>";
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new TRPCError15({
      code: "INTERNAL_SERVER_ERROR",
      message: "Email service is not configured. Please contact support directly."
    });
  }
  return new Resend4(process.env.RESEND_API_KEY);
}
var supportRouter = router({
  sendMessage: protectedProcedure.input(z14.object({
    subject: z14.string().min(1),
    message: z14.string().min(10),
    requestType: z14.enum(["url_change", "bug_report", "feature_request", "general"])
  })).mutation(async ({ input, ctx }) => {
    const user = ctx.user;
    const requestTypeLabels = {
      url_change: "URL Change Request",
      bug_report: "Bug Report",
      feature_request: "Feature Request",
      general: "General Support"
    };
    const emailHtml = `
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6BC4B8 0%, #5A9FD4 50%, #9B7FB8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .info-box { background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0; }
          .label { font-weight: bold; color: #6BC4B8; }
        </style>
        <div class="container">
          <div class="header">
            <h1>Support Request</h1>
          </div>
          <div class="content">
            <div class="info-box">
              <p><span class="label">Request Type:</span> ${requestTypeLabels[input.requestType]}</p>
              <p><span class="label">Subject:</span> ${input.subject}</p>
            </div>
            
            <div class="info-box">
              <p><span class="label">From User:</span></p>
              <p>Name: ${user.name || "Unknown"}</p>
              <p>Email: ${user.email}</p>
              <p>User ID: ${user.id}</p>
              ${user.householdId ? `<p>Household ID: ${user.householdId}</p>` : ""}
            </div>

            <div class="info-box">
              <p><span class="label">Message:</span></p>
              <p style="white-space: pre-wrap;">${input.message}</p>
            </div>
          </div>
        </div>
      `;
    try {
      const resend4 = getResendClient();
      await resend4.emails.send({
        from: FROM_EMAIL4,
        to: SUPPORT_EMAIL,
        replyTo: user.email || void 0,
        subject: `[OBK Support] ${requestTypeLabels[input.requestType]}: ${input.subject}`,
        html: emailHtml
      });
      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError15) {
        throw error;
      }
      console.error("Failed to send support email:", error);
      throw new TRPCError15({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send support request. Please try again later."
      });
    }
  })
});

// server/routers.ts
async function checkHouseholdAccess(userId, householdId, requireRole) {
  const user = await getUserById(userId);
  if (!user || user.householdId !== householdId) {
    throw new TRPCError16({ code: "FORBIDDEN", message: "Access denied to this household" });
  }
  if (requireRole === "primary" && user.role !== "primary") {
    throw new TRPCError16({ code: "FORBIDDEN", message: "Primary role required" });
  }
  if (requireRole === "admin" && user.role !== "admin" && user.role !== "primary") {
    throw new TRPCError16({ code: "FORBIDDEN", message: "Admin or Primary role required" });
  }
  return user;
}
var appRouter = router({
  system: systemRouter,
  invite: inviteRouter,
  adminMessage: adminMessageRouter,
  adminGroup: adminGroupRouter,
  updates: updatesRouter,
  needs: needsRouter,
  events: eventsRouter,
  messages: messagesRouter,
  mealTrain: mealTrainRouter,
  notification: notificationRouter,
  memoryWall: memoryWallRouter,
  giftRegistry: giftRegistryRouter,
  reminder: reminderRouter,
  onboarding: onboardingRouter,
  support: supportRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  household: router({
    // Public endpoint to search households by name (fuzzy matching)
    search: publicProcedure.input(z15.object({ query: z15.string().min(1) })).query(async ({ input }) => {
      const households2 = await searchHouseholds(input.query);
      return households2.map((household) => ({
        id: household.id,
        name: household.name,
        description: household.description,
        photoUrl: household.photoUrl,
        slug: household.slug
      }));
    }),
    // Public endpoint to get household info by slug (for public join page)
    getBySlug: publicProcedure.input(z15.object({ slug: z15.string() })).query(async ({ input }) => {
      const household = await getHouseholdBySlug(input.slug);
      if (!household) {
        throw new TRPCError16({
          code: "NOT_FOUND",
          message: "Household not found"
        });
      }
      return {
        id: household.id,
        name: household.name,
        description: household.description,
        photoUrl: household.photoUrl,
        slug: household.slug
      };
    }),
    // Get current user's household
    getMy: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return null;
      }
      return await getHousehold(ctx.user.householdId);
    }),
    // Create a new household (for Primary user or Admin setting up on behalf)
    create: protectedProcedure.input(
      z15.object({
        name: z15.string().min(1),
        timezone: z15.string().default("America/Chicago"),
        delegateAdminApprovals: z15.boolean().default(false),
        setupRole: z15.enum(["primary", "admin"]).default("primary"),
        primaryName: z15.string().optional(),
        primaryEmail: z15.string().email().optional(),
        additionalAdmins: z15.array(
          z15.object({
            id: z15.string(),
            name: z15.string(),
            email: z15.string().email()
          })
        ).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (input.setupRole === "admin" && (!input.primaryName || !input.primaryEmail)) {
        throw new TRPCError16({
          code: "BAD_REQUEST",
          message: "Primary name and email required for admin setup"
        });
      }
      const householdId = await createHousehold({
        name: input.name,
        primaryUserId: ctx.user.id,
        timezone: input.timezone,
        delegateAdminApprovals: input.delegateAdminApprovals,
        quietMode: false
      });
      if (input.setupRole === "primary") {
        await upsertUser({
          id: ctx.user.id,
          role: "primary",
          accessTier: "family",
          householdId,
          status: "active"
        });
      } else {
        await upsertUser({
          id: ctx.user.id,
          role: "admin",
          accessTier: "family",
          householdId,
          status: "active"
        });
        const inviteToken = crypto2.randomBytes(32).toString("hex");
        const expiresAt = /* @__PURE__ */ new Date();
        expiresAt.setDate(expiresAt.getDate() + 14);
        await createInvite({
          householdId,
          invitedEmail: input.primaryEmail,
          invitedPhone: null,
          invitedRole: "primary",
          inviterUserId: ctx.user.id,
          token: inviteToken,
          status: "sent",
          expiresAt
        });
        const household = await getHousehold(householdId);
        if (household) {
          const emailResult = await sendInviteNotification(
            input.primaryEmail,
            null,
            // No phone
            null,
            // No slug needed - will use token
            household.name,
            ctx.user.name || "An admin",
            {
              token: inviteToken,
              isPrimary: true,
              recipientName: input.primaryName || void 0
            }
          );
          await createAuditLog({
            householdId,
            actorUserId: ctx.user.id,
            action: emailResult.success ? "primary_invite_sent" : "primary_invite_send_failed",
            targetType: "household",
            targetId: householdId,
            metadata: {
              primaryEmail: input.primaryEmail,
              primaryName: input.primaryName,
              emailSuccess: emailResult.success,
              emailError: emailResult.error || null
            }
          });
          if (!emailResult.success) {
            console.error(
              `[Household] Failed to send primary invite email: ${emailResult.error}`
            );
            throw new TRPCError16({
              code: "INTERNAL_SERVER_ERROR",
              message: `Household created but failed to send primary invite email: ${emailResult.error}. Please try resending the invite from the People page.`
            });
          }
          console.log(
            `[Household] Primary invite email sent to ${input.primaryName} (${input.primaryEmail})`
          );
        }
      }
      if (input.additionalAdmins && input.additionalAdmins.length > 0) {
        console.log(
          `[Household] Need to invite ${input.additionalAdmins.length} additional admins:`,
          input.additionalAdmins.map((a) => a.email).join(", ")
        );
      }
      const innerCircleId = await createGroup({
        householdId,
        name: "Inner Circle",
        description: "Closest friends and family"
      });
      const immediateFamilyId = await createGroup({
        householdId,
        name: "Immediate Family",
        description: "Direct family members"
      });
      await createGroup({
        householdId,
        name: "Church/Community",
        description: "Church members and community friends"
      });
      await addUserToGroup(innerCircleId, ctx.user.id);
      await addUserToGroup(immediateFamilyId, ctx.user.id);
      await createAuditLog({
        householdId,
        actorUserId: ctx.user.id,
        action: "household_created",
        targetType: "household",
        targetId: householdId,
        metadata: {
          name: input.name,
          setupRole: input.setupRole,
          primaryEmail: input.primaryEmail
        }
      });
      return {
        householdId,
        needsPrimaryInvite: input.setupRole === "admin",
        primaryEmail: input.primaryEmail,
        additionalAdminsCount: input.additionalAdmins?.length || 0
      };
    }),
    // Update household settings
    update: protectedProcedure.input(
      z15.object({
        name: z15.string().optional(),
        description: z15.string().optional(),
        quietMode: z15.boolean().optional(),
        timezone: z15.string().optional(),
        delegateAdminApprovals: z15.boolean().optional(),
        showMemorialSubtitle: z15.boolean().optional(),
        memorialName: z15.string().optional(),
        memorialBirthDate: z15.string().optional(),
        memorialPassingDate: z15.string().optional(),
        customDashboardMessage: z15.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "No household found" });
      }
      const canUpdate = ctx.user.role === "primary" || ctx.user.role === "admin";
      if (!canUpdate) {
        throw new TRPCError16({
          code: "FORBIDDEN",
          message: "Only Primary or Admin can update household settings"
        });
      }
      await updateHousehold(ctx.user.householdId, input);
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "household_updated",
        targetType: "household",
        targetId: ctx.user.householdId,
        metadata: input
      });
      return { success: true };
    }),
    // Get notification preferences for current user
    getNotificationPrefs: protectedProcedure.query(async ({ ctx }) => {
      return await getNotificationPrefs(ctx.user.id);
    }),
    // Update notification preferences
    updateNotificationPrefs: protectedProcedure.input(
      z15.object({
        channelEmail: z15.boolean().optional(),
        channelSms: z15.boolean().optional(),
        channelPush: z15.boolean().optional(),
        digestFrequency: z15.enum(["immediate", "daily", "weekly"]).optional(),
        urgentNeedsAlerts: z15.boolean().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      await upsertNotificationPrefs(ctx.user.id, input);
      return { success: true };
    }),
    // Get recent activity from audit logs
    getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await getRecentActivity(ctx.user.householdId, 20);
    }),
    // Allow users to join a household with a requested tier
    joinWithTier: protectedProcedure.input(
      z15.object({
        householdId: z15.number(),
        requestedTier: z15.enum(["community", "friend", "family"])
      })
    ).mutation(async ({ ctx, input }) => {
      await joinHouseholdWithTier(ctx.user.id, input.householdId, input.requestedTier);
      await createAuditLog({
        householdId: input.householdId,
        actorUserId: ctx.user.id,
        action: "user_joined_with_tier_request",
        targetType: "user",
        targetId: 0,
        metadata: { userId: ctx.user.id, requestedTier: input.requestedTier }
      });
      return { success: true };
    }),
    // Update auto-promote settings (admin/primary only)
    updateAutoPromoteSettings: protectedProcedure.input(
      z15.object({
        autoPromoteEnabled: z15.boolean().optional(),
        autoPromoteHours: z15.number().min(1).max(168).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "No household found" });
      }
      await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");
      await updateHouseholdAutoPromote(ctx.user.householdId, input);
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "household_auto_promote_updated",
        targetType: "household",
        targetId: ctx.user.householdId,
        metadata: input
      });
      return { success: true };
    }),
    // Update household slug (admin/primary only)
    updateSlug: protectedProcedure.input(
      z15.object({
        slug: z15.string().min(3, "Slug must be at least 3 characters").max(255, "Slug cannot exceed 255 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
      })
    ).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({
          code: "BAD_REQUEST",
          message: "No household found"
        });
      }
      await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");
      const isAvailable = await isSlugAvailable(input.slug, ctx.user.householdId);
      if (!isAvailable) {
        throw new TRPCError16({
          code: "BAD_REQUEST",
          message: "This slug is already taken"
        });
      }
      await updateHousehold(ctx.user.householdId, { slug: input.slug });
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "household_slug_updated",
        targetType: "household",
        targetId: ctx.user.householdId,
        metadata: { slug: input.slug }
      });
      return {
        success: true,
        slug: input.slug
      };
    }),
    // Update dashboard display settings (admin/primary only)
    updateDashboardDisplay: protectedProcedure.input(
      z15.object({
        displayType: z15.enum(["none", "photo", "slideshow", "quote", "memory"]),
        photoUrl: z15.string().optional(),
        photos: z15.array(z15.string()).optional(),
        quote: z15.string().optional(),
        quoteAttribution: z15.string().optional(),
        featuredMemoryId: z15.number().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({
          code: "BAD_REQUEST",
          message: "No household found"
        });
      }
      await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");
      if (input.displayType === "photo" && !input.photoUrl) {
        throw new TRPCError16({
          code: "BAD_REQUEST",
          message: "Photo display requires a photo to be uploaded"
        });
      }
      if (input.displayType === "slideshow") {
        if (!input.photos || input.photos.length < 3 || input.photos.length > 5) {
          throw new TRPCError16({
            code: "BAD_REQUEST",
            message: "Slideshow requires 3-5 photos"
          });
        }
      }
      if (input.displayType === "quote" && !input.quote) {
        throw new TRPCError16({
          code: "BAD_REQUEST",
          message: "Quote display requires quote text"
        });
      }
      if (input.displayType === "memory" && !input.featuredMemoryId) {
        throw new TRPCError16({
          code: "BAD_REQUEST",
          message: "Memory display requires a selected memory"
        });
      }
      await updateHousehold(ctx.user.householdId, {
        dashboardDisplayType: input.displayType,
        photoUrl: input.photoUrl || null,
        dashboardPhotos: input.photos || [],
        dashboardQuote: input.quote || null,
        dashboardQuoteAttribution: input.quoteAttribution || null,
        dashboardFeaturedMemoryId: input.featuredMemoryId || null
      });
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "dashboard_display_updated",
        targetType: "household",
        targetId: ctx.user.householdId,
        metadata: { displayType: input.displayType }
      });
      return { success: true };
    })
  }),
  user: router({
    // Get all users in current household
    listInHousehold: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await getUsersByHousehold(ctx.user.householdId);
    }),
    // Update user profile (name, phone, profile picture)
    updateProfile: protectedProcedure.input(
      z15.object({
        name: z15.string().optional(),
        phone: z15.string().optional(),
        profileImageUrl: z15.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      await updateUserProfile(ctx.user.id, input);
      if (ctx.user.householdId) {
        await createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "user_profile_updated",
          targetType: "user",
          targetId: 0,
          metadata: { userId: ctx.user.id, updates: input }
        });
      }
      return { success: true };
    }),
    // Update user status (approve/block)
    updateStatus: protectedProcedure.input(
      z15.object({
        userId: z15.string(),
        status: z15.enum(["active", "pending", "blocked"])
      })
    ).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "No household found" });
      }
      const household = await getHousehold(ctx.user.householdId);
      if (!household) {
        throw new TRPCError16({ code: "NOT_FOUND", message: "Household not found" });
      }
      const canApprove = ctx.user.role === "primary" || ctx.user.role === "admin" && household.delegateAdminApprovals;
      if (!canApprove) {
        throw new TRPCError16({
          code: "FORBIDDEN",
          message: "Only Primary or delegated Admin can update user status"
        });
      }
      await updateUserStatus(input.userId, input.status);
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "user_status_updated",
        targetType: "user",
        targetId: 0,
        // Placeholder since user IDs are strings
        metadata: { userId: input.userId, status: input.status }
      });
      return { success: true };
    }),
    // Update user role (primary and admin)
    updateRole: protectedProcedure.input(
      z15.object({
        userId: z15.string(),
        role: z15.enum(["admin", "supporter"])
      })
    ).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "No household found" });
      }
      if (ctx.user.role !== "primary" && ctx.user.role !== "admin") {
        throw new TRPCError16({
          code: "FORBIDDEN",
          message: "Only Primary or Admin can change user roles"
        });
      }
      const targetUser = await getUserById(input.userId);
      if (!targetUser) {
        throw new TRPCError16({ code: "NOT_FOUND", message: "User not found" });
      }
      if (targetUser.householdId !== ctx.user.householdId) {
        throw new TRPCError16({ code: "FORBIDDEN", message: "User belongs to different household" });
      }
      if (targetUser.id === ctx.user.id) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "Cannot change your own role" });
      }
      if (targetUser.role === "primary") {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "Cannot change Primary role" });
      }
      await updateUserRole(input.userId, input.role);
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "user_role_updated",
        targetType: "user",
        targetId: 0,
        metadata: { userId: input.userId, newRole: input.role }
      });
      return { success: true };
    }),
    // Remove user from household (admin/primary only)
    removeFromHousehold: protectedProcedure.input(
      z15.object({
        userId: z15.string()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "No household found" });
      }
      if (ctx.user.role !== "admin" && ctx.user.role !== "primary") {
        throw new TRPCError16({
          code: "FORBIDDEN",
          message: "Only Admin or Primary can remove users from the household"
        });
      }
      const targetUser = await getUserById(input.userId);
      if (!targetUser) {
        throw new TRPCError16({ code: "NOT_FOUND", message: "User not found" });
      }
      if (targetUser.householdId !== ctx.user.householdId) {
        throw new TRPCError16({ code: "FORBIDDEN", message: "User belongs to different household" });
      }
      if (input.userId === ctx.user.id) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "Cannot remove yourself from household" });
      }
      await removeUserFromHousehold(input.userId, ctx.user.householdId);
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "user_removed_from_household",
        targetType: "user",
        targetId: 0,
        metadata: { userId: input.userId, userName: targetUser.name }
      });
      return { success: true };
    }),
    // Get pending tier requests (admin/primary only)
    getPendingTierRequests: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");
      return await getUsersPendingTierApproval(ctx.user.householdId);
    }),
    // Approve tier request (admin/primary only)
    approveTierRequest: protectedProcedure.input(
      z15.object({
        userId: z15.string()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "No household found" });
      }
      await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");
      const targetUser = await getUserById(input.userId);
      if (!targetUser) {
        throw new TRPCError16({ code: "NOT_FOUND", message: "User not found" });
      }
      if (targetUser.householdId !== ctx.user.householdId) {
        throw new TRPCError16({ code: "FORBIDDEN", message: "User belongs to different household" });
      }
      if (!targetUser.requestedTier) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "User has no pending tier request" });
      }
      await updateUserAccessTier(input.userId, targetUser.requestedTier);
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "tier_request_approved",
        targetType: "user",
        targetId: 0,
        metadata: {
          userId: input.userId,
          approvedTier: targetUser.requestedTier,
          userName: targetUser.name
        }
      });
      return { success: true };
    })
  }),
  group: router({
    // List all groups in household
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await getGroupsByHousehold(ctx.user.householdId);
    }),
    // Get user's groups
    getMy: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await getUserGroups(ctx.user.id, ctx.user.householdId);
    }),
    // Create a new group
    create: protectedProcedure.input(
      z15.object({
        name: z15.string().min(1),
        description: z15.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "No household found" });
      }
      await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");
      const groupId = await createGroup({
        householdId: ctx.user.householdId,
        name: input.name,
        description: input.description
      });
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "group_created",
        targetType: "group",
        targetId: groupId,
        metadata: { name: input.name }
      });
      return { groupId };
    }),
    // Add user to group
    addMember: protectedProcedure.input(
      z15.object({
        groupId: z15.number(),
        userId: z15.string()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "No household found" });
      }
      await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");
      await addUserToGroup(input.groupId, input.userId);
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "group_member_added",
        targetType: "group",
        targetId: input.groupId,
        metadata: { userId: input.userId }
      });
      return { success: true };
    }),
    // Remove user from group
    removeMember: protectedProcedure.input(
      z15.object({
        groupId: z15.number(),
        userId: z15.string()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "No household found" });
      }
      await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");
      await removeUserFromGroup(input.groupId, input.userId);
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "group_member_removed",
        targetType: "group",
        targetId: input.groupId,
        metadata: { userId: input.userId }
      });
      return { success: true };
    }),
    // Update group details
    update: protectedProcedure.input(
      z15.object({
        groupId: z15.number(),
        name: z15.string().min(1).optional(),
        description: z15.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "No household found" });
      }
      await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");
      await updateGroup(input.groupId, {
        name: input.name,
        description: input.description
      });
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "group_updated",
        targetType: "group",
        targetId: input.groupId,
        metadata: { name: input.name, description: input.description }
      });
      return { success: true };
    }),
    // Delete group
    delete: protectedProcedure.input(z15.object({ groupId: z15.number() })).mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError16({ code: "BAD_REQUEST", message: "No household found" });
      }
      await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");
      await deleteGroup(input.groupId);
      await createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "group_deleted",
        targetType: "group",
        targetId: input.groupId,
        metadata: {}
      });
      return { success: true };
    }),
    // Get members of a group
    getMembers: protectedProcedure.input(z15.object({ groupId: z15.number() })).query(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await getGroupMembers(input.groupId);
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    const req = opts.req;
    if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
      const userId = req.user.claims.sub;
      user = await getUser(userId);
    }
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/uploadRouter.ts
import { Router } from "express";
import multer from "multer";

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // Gets the private object directory.
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Upload a file directly to storage
  async uploadFile(buffer, filename, contentType) {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const extension = filename.split(".").pop();
    const fullPath = `${privateObjectDir}/uploads/${objectId}${extension ? "." + extension : ""}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    console.log("[ObjectStorage] Upload attempt:", {
      privateObjectDir,
      fullPath,
      bucketName,
      objectName,
      filename,
      contentType,
      bufferSize: buffer.length
    });
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    try {
      await file.save(buffer, {
        contentType,
        metadata: {
          contentType
        }
      });
      console.log("[ObjectStorage] Upload successful:", { bucketName, objectName });
    } catch (error) {
      console.error("[ObjectStorage] Upload failed:", {
        bucketName,
        objectName,
        error: error instanceof Error ? error.message : String(error),
        errorCode: error?.code,
        errorDetails: error?.errors
      });
      throw error;
    }
    return `/objects/uploads/${objectId}${extension ? "." + extension : ""}`;
  }
  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  // Downloads an object to the response.
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
};
function parseObjectPath(path2) {
  if (!path2.startsWith("/")) {
    path2 = `/${path2}`;
  }
  const pathParts = path2.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/uploadRouter.ts
import fs from "fs/promises";
import path from "path";
var router2 = Router();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  }
});
var uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);
router2.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    if (!process.env.PRIVATE_OBJECT_DIR) {
      console.error("Object storage not configured - PRIVATE_OBJECT_DIR missing");
      return res.status(500).json({
        error: "File storage not configured. Please set up object storage."
      });
    }
    console.log("Starting upload:", {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      objectDir: process.env.PRIVATE_OBJECT_DIR
    });
    const objectStorageService = new ObjectStorageService();
    const url = await objectStorageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    console.log("Upload successful:", url);
    res.json({ url, filename: req.file.originalname });
  } catch (error) {
    console.error("Upload error details:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : void 0,
      filename: req.file?.originalname
    });
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
    res.status(500).json({ error: errorMessage });
  }
});
var uploadRouter_default = router2;

// server/reminderProcessor.ts
import { sql as sql3, eq as eq7 } from "drizzle-orm";
async function processReminders() {
  console.log("[Reminders] Starting reminder processing...");
  const db = await getDb();
  if (!db) {
    console.error("[Reminders] Database not available");
    return;
  }
  try {
    const now = /* @__PURE__ */ new Date();
    const pendingReminders = await db.select().from(reminders).where(
      sql3`(
          (${reminders.status} = 'queued' AND ${reminders.triggerAt} <= ${now})
          OR
          (${reminders.status} = 'failed' AND ${reminders.retryAt} IS NOT NULL AND ${reminders.retryAt} <= ${now})
        )`
    ).limit(100);
    console.log(`[Reminders] Found ${pendingReminders.length} pending reminders`);
    for (const reminder of pendingReminders) {
      try {
        if (reminder.status === "failed") {
          await db.update(reminders).set({ status: "queued", updatedAt: /* @__PURE__ */ new Date() }).where(eq7(reminders.id, reminder.id));
        }
        const user = await db.select().from(users).where(eq7(users.id, reminder.userId)).limit(1);
        if (user.length === 0) {
          console.warn(`[Reminders] User not found for reminder ${reminder.id}`);
          await db.update(reminders).set({
            status: "cancelled",
            errorMessage: "User not found",
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq7(reminders.id, reminder.id));
          continue;
        }
        let context = {};
        let notificationType;
        let actionUrl;
        if (reminder.targetType === "personal") {
          notificationType = "personal_reminder";
          actionUrl = `/reminders`;
          context = {
            reminderTitle: reminder.title || "Personal Reminder",
            reminderDescription: reminder.description || ""
          };
        } else if (reminder.targetType === "need") {
          if (!reminder.targetId) {
            console.warn(`[Reminders] Need reminder ${reminder.id} has no targetId`);
            await db.update(reminders).set({
              status: "cancelled",
              errorMessage: "Need reminder missing targetId",
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq7(reminders.id, reminder.id));
            continue;
          }
          const need = await db.select().from(needs).where(eq7(needs.id, reminder.targetId)).limit(1);
          if (need.length === 0) {
            console.warn(`[Reminders] Need not found for reminder ${reminder.id}`);
            await db.update(reminders).set({
              status: "cancelled",
              errorMessage: "Need not found",
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq7(reminders.id, reminder.id));
            continue;
          }
          const needData = need[0];
          notificationType = "need_reminder";
          actionUrl = `/needs`;
          context = {
            needTitle: needData.title,
            needDescription: needData.details || "",
            needDueDate: needData.dueAt ? new Date(needData.dueAt).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit"
            }) : "No due date"
          };
        } else {
          if (!reminder.targetId) {
            console.warn(`[Reminders] Event reminder ${reminder.id} has no targetId`);
            await db.update(reminders).set({
              status: "cancelled",
              errorMessage: "Event reminder missing targetId",
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq7(reminders.id, reminder.id));
            continue;
          }
          const event = await db.select().from(events).where(eq7(events.id, reminder.targetId)).limit(1);
          if (event.length === 0) {
            console.warn(`[Reminders] Event not found for reminder ${reminder.id}`);
            await db.update(reminders).set({
              status: "cancelled",
              errorMessage: "Event not found",
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq7(reminders.id, reminder.id));
            continue;
          }
          const eventData = event[0];
          notificationType = "event_reminder";
          actionUrl = `/events`;
          context = {
            eventTitle: eventData.title,
            eventDescription: eventData.description || "",
            eventStartTime: new Date(eventData.startAt).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit"
            }),
            eventLocation: eventData.location || ""
          };
        }
        await sendNotificationEmail(
          reminder.userId,
          reminder.householdId,
          notificationType,
          {
            ...context,
            actionUrl
          }
        );
        await db.update(reminders).set({
          status: "sent",
          sentAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq7(reminders.id, reminder.id));
        console.log(`[Reminders] Sent ${reminder.targetType} reminder ${reminder.id} to user ${reminder.userId}`);
      } catch (error) {
        console.error(`[Reminders] Error processing reminder ${reminder.id}:`, error);
        const retryAt = new Date(Date.now() + 15 * 60 * 1e3);
        await db.update(reminders).set({
          status: "failed",
          errorMessage: error.message || "Unknown error",
          retryAt,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq7(reminders.id, reminder.id));
      }
    }
    console.log("[Reminders] Reminder processing completed");
  } catch (error) {
    console.error("[Reminders] Error during reminder processing:", error);
  }
}

// server/_core/app.ts
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
    tracesSampleRate: 1,
    environment: process.env.NODE_ENV || "development"
  });
}
async function createApp() {
  const app = express();
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/cron/reminders", async (req, res) => {
    const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
    if (!process.env.CRON_SECRET || req.headers.authorization !== expected) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      await processReminders();
      res.json({ ok: true });
    } catch (error) {
      console.error("[Cron] processReminders error:", error);
      res.status(500).json({ error: "Failed" });
    }
  });
  await setupAuth(app);
  await setupTestAuth(app);
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app.use("/api", uploadRouter_default);
  app.use("/uploads", express.static("uploads"));
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      return res.status(500).json({ error: "Error serving file" });
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app;
}

// server/_vercel/handler.ts
var appPromise = createApp();
async function handler(req, res) {
  const app = await appPromise;
  return app(req, res);
}
export {
  handler as default
};
