import { sql } from "drizzle-orm";
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
  real,
} from "drizzle-orm/pg-core";

// Replit Auth: Session storage table
// Reference: blueprint:javascript_log_in_with_replit
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("sessions_expire_idx").on(table.expire)],
);

// Define PostgreSQL enums
export const userRoleEnum = pgEnum("user_role", ["primary", "admin", "supporter", "user"]);
export const userStatusEnum = pgEnum("user_status", ["active", "pending", "blocked"]);
export const invitedRoleEnum = pgEnum("invited_role", ["admin", "supporter"]);
export const inviteStatusEnum = pgEnum("invite_status", ["sent", "accepted", "revoked", "expired"]);
export const visibilityScopeEnum = pgEnum("visibility_scope", ["private", "all_supporters", "group", "role", "custom"]);
export const minRoleEnum = pgEnum("min_role", ["supporter", "admin", "primary"]);
export const rsvpStatusEnum = pgEnum("rsvp_status", ["going", "maybe", "declined"]);
export const needCategoryEnum = pgEnum("need_category", ["meals", "rides", "errands", "childcare", "household", "other"]);
export const priorityEnum = pgEnum("priority", ["low", "normal", "urgent"]);
export const needStatusEnum = pgEnum("need_status", ["open", "claimed", "completed", "cancelled"]);
export const claimStatusEnum = pgEnum("claim_status", ["claimed", "completed", "released"]);
export const updateTypeEnum = pgEnum("update_type", ["general", "gratitude", "memory", "milestone"]);
export const digestFrequencyEnum = pgEnum("digest_frequency", ["immediate", "daily", "weekly"]);
export const recipientTypeEnum = pgEnum("recipient_type", ["individual", "group", "all"]);
export const mealSignupStatusEnum = pgEnum("meal_signup_status", ["pending", "confirmed", "completed", "cancelled"]);
export const notificationTypeEnum = pgEnum("notification_type", [
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
  "invite_sent"
]);
export const notificationChannelEnum = pgEnum("notification_channel", ["email", "push"]);
export const reminderTargetTypeEnum = pgEnum("reminder_target_type", ["need", "event"]);
export const reminderStatusEnum = pgEnum("reminder_status", ["queued", "sent", "cancelled", "failed"]);
export const memoryWallTypeEnum = pgEnum("memory_wall_type", ["memory", "story", "encouragement", "prayer", "picture"]);
export const giftStatusEnum = pgEnum("gift_status", ["needed", "purchased", "received"]);
export const eventTypeEnum = pgEnum("event_type", ["regular", "birthday", "anniversary", "milestone", "holiday"]);
export const accessTierEnum = pgEnum("access_tier", ["community", "friend", "family"]);
export const dashboardDisplayTypeEnum = pgEnum("dashboard_display_type", ["none", "photo", "slideshow", "quote", "memory"]);
export const tourStatusEnum = pgEnum("tour_status", ["not_started", "in_progress", "completed", "dismissed"]);
export const tourScopeEnum = pgEnum("tour_scope", ["household", "feature", "help"]);

/**
 * Core user table backing auth flow.
 * Modified for Replit Auth integration - uses varchar ID from OpenID Connect
 * Extended with role and household support for Our Brother's Keeper.
 */
export const users = pgTable("users", {
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
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("users_household_idx").on(table.householdId),
  statusIdx: index("users_status_idx").on(table.status),
  emailIdx: index("users_email_idx").on(table.email),
}));

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = typeof users.$inferInsert;

/**
 * Households - the core organizational unit
 */
export const households = pgTable("households", {
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
  dashboardPhotos: jsonb("dashboard_photos").$type<string[]>().default([]),
  dashboardQuote: text("dashboard_quote"),
  dashboardQuoteAttribution: text("dashboard_quote_attribution"),
  dashboardFeaturedMemoryId: integer("dashboard_featured_memory_id"),
  showMemorialSubtitle: boolean("show_memorial_subtitle").default(false).notNull(),
  memorialName: varchar("memorial_name", { length: 255 }),
  memorialBirthDate: date("memorial_birth_date"),
  memorialPassingDate: date("memorial_passing_date"),
  customDashboardMessage: text("custom_dashboard_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  primaryUserIdx: index("households_primary_user_idx").on(table.primaryUserId),
  slugIdx: uniqueIndex("households_slug_idx").on(table.slug),
}));

export type Household = typeof households.$inferSelect;
export type InsertHousehold = typeof households.$inferInsert;

/**
 * Groups - visibility groups per household (Inner Circle, Immediate Family, etc.)
 */
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("groups_household_idx").on(table.householdId),
}));

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

/**
 * Group Members - junction table for users in groups
 */
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  groupUserIdx: uniqueIndex("group_members_group_user_idx").on(table.groupId, table.userId),
  userIdx: index("group_members_user_idx").on(table.userId),
}));

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;

/**
 * Invites - for inviting supporters to join a household
 */
export const invites = pgTable("invites", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  invitedEmail: varchar("invited_email", { length: 320 }),
  invitedPhone: varchar("invited_phone", { length: 20 }),
  invitedRole: invitedRoleEnum("invited_role").notNull(),
  inviterUserId: varchar("inviter_user_id").notNull(),
  status: inviteStatusEnum("status").default("sent").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => ({
  householdIdx: index("invites_household_idx").on(table.householdId),
  tokenIdx: index("invites_token_idx").on(table.token),
  statusIdx: index("invites_status_idx").on(table.status),
}));

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = typeof invites.$inferInsert;

/**
 * Events - calendar events for the household
 */
export const events = pgTable("events", {
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
  customUserIds: jsonb("custom_user_ids").$type<string[]>(),
  minRole: minRoleEnum("min_role"),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("events_household_idx").on(table.householdId),
  startAtIdx: index("events_start_at_idx").on(table.startAt),
  visibilityIdx: index("events_visibility_idx").on(table.visibilityScope),
  eventTypeIdx: index("events_event_type_idx").on(table.eventType),
}));

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Event RSVPs - track who's attending events
 */
export const eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: rsvpStatusEnum("status").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  eventUserIdx: uniqueIndex("event_rsvps_event_user_idx").on(table.eventId, table.userId),
  userIdx: index("event_rsvps_user_idx").on(table.userId),
}));

export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = typeof eventRsvps.$inferInsert;

/**
 * Needs - help board items (meals, rides, errands, etc.)
 */
export const needs = pgTable("needs", {
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
  customUserIds: jsonb("custom_user_ids").$type<string[]>(),
  status: needStatusEnum("status").default("open").notNull(),
  capacity: integer("capacity"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("needs_household_idx").on(table.householdId),
  statusIdx: index("needs_status_idx").on(table.status),
  categoryIdx: index("needs_category_idx").on(table.category),
  dueAtIdx: index("needs_due_at_idx").on(table.dueAt),
}));

export type Need = typeof needs.$inferSelect;
export type InsertNeed = typeof needs.$inferInsert;

/**
 * Need Claims - track who claimed which needs
 */
export const needClaims = pgTable("need_claims", {
  id: serial("id").primaryKey(),
  needId: integer("need_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: claimStatusEnum("status").default("claimed").notNull(),
  note: text("note"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  needIdx: index("need_claims_need_idx").on(table.needId),
  userIdx: index("need_claims_user_idx").on(table.userId),
  statusIdx: index("need_claims_status_idx").on(table.status),
}));

export type NeedClaim = typeof needClaims.$inferSelect;
export type InsertNeedClaim = typeof needClaims.$inferInsert;

/**
 * Messages - DM/group/broadcast messaging
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  threadId: varchar("thread_id", { length: 64 }),
  senderUserId: varchar("sender_user_id").notNull(),
  body: text("body").notNull(),
  visibilityScope: visibilityScopeEnum("visibility_scope").default("all_supporters").notNull(),
  visibilityGroupIds: integer("visibility_group_ids").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("messages_household_idx").on(table.householdId),
  threadIdx: index("messages_thread_idx").on(table.threadId),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Announcements - broadcast messages from Primary/Admin
 */
export const announcements = pgTable("announcements", {
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("announcements_household_idx").on(table.householdId),
  pinnedIdx: index("announcements_pinned_idx").on(table.pinned),
  createdAtIdx: index("announcements_created_at_idx").on(table.createdAt),
}));

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Updates - personal updates from Primary with photos
 */
export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  authorId: varchar("author_id").notNull(),
  type: updateTypeEnum("type").default("general").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  photoUrls: jsonb("photo_urls").$type<string[] | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("updates_household_idx").on(table.householdId),
  authorIdx: index("updates_author_idx").on(table.authorId),
  createdAtIdx: index("updates_created_at_idx").on(table.createdAt),
}));

export type Update = typeof updates.$inferSelect;
export type InsertUpdate = typeof updates.$inferInsert;

/**
 * Notification Preferences - per-user notification settings
 */
export const notificationPrefs = pgTable("notification_prefs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  channelEmail: boolean("channel_email").default(true).notNull(),
  channelSms: boolean("channel_sms").default(false).notNull(),
  channelPush: boolean("channel_push").default(true).notNull(),
  digestFrequency: digestFrequencyEnum("digest_frequency").default("daily").notNull(),
  urgentNeedsAlerts: boolean("urgent_needs_alerts").default(true).notNull(),
  quietHours: jsonb("quiet_hours").$type<{ start: string; end: string } | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notification_prefs_user_idx").on(table.userId),
}));

export type NotificationPref = typeof notificationPrefs.$inferSelect;
export type InsertNotificationPref = typeof notificationPrefs.$inferInsert;

/**
 * Admin Messages - messages sent by admins to supporters
 */
export const adminMessages = pgTable("admin_messages", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  recipientType: recipientTypeEnum("recipient_type").notNull(),
  recipientGroupId: integer("recipient_group_id"),
  includedPrimary: boolean("included_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("admin_messages_household_idx").on(table.householdId),
  senderIdx: index("admin_messages_sender_idx").on(table.senderId),
}));

export type AdminMessage = typeof adminMessages.$inferSelect;
export type InsertAdminMessage = typeof adminMessages.$inferInsert;

/**
 * Admin Message Recipients - tracks who received each admin message
 */
export const adminMessageRecipients = pgTable("admin_message_recipients", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  userId: varchar("user_id").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  messageIdx: index("admin_message_recipients_message_idx").on(table.messageId),
  userIdx: index("admin_message_recipients_user_idx").on(table.userId),
}));

export type AdminMessageRecipient = typeof adminMessageRecipients.$inferSelect;
export type InsertAdminMessageRecipient = typeof adminMessageRecipients.$inferInsert;

/**
 * Admin Groups - custom groups created by admins for targeted communication
 */
export const adminGroups = pgTable("admin_groups", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("admin_groups_household_idx").on(table.householdId),
}));

export type AdminGroup = typeof adminGroups.$inferSelect;
export type InsertAdminGroup = typeof adminGroups.$inferInsert;

/**
 * Admin Group Members - members of admin-created groups
 */
export const adminGroupMembers = pgTable("admin_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: varchar("user_id").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
}, (table) => ({
  groupIdx: index("admin_group_members_group_idx").on(table.groupId),
  userIdx: index("admin_group_members_user_idx").on(table.userId),
  groupUserIdx: uniqueIndex("admin_group_members_group_user_idx").on(table.groupId, table.userId),
}));

export type AdminGroupMember = typeof adminGroupMembers.$inferSelect;
export type InsertAdminGroupMember = typeof adminGroupMembers.$inferInsert;

/**
 * Audit Logs - track all important actions for transparency
 */
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  actorUserId: varchar("actor_user_id").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  targetType: varchar("target_type", { length: 64 }).notNull(),
  targetId: integer("target_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("audit_logs_household_idx").on(table.householdId),
  actorIdx: index("audit_logs_actor_idx").on(table.actorUserId),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Meal Trains - Configuration for meal delivery coordination
 * One meal train per household with settings for location, capacity, preferences
 */
export const mealTrains = pgTable("meal_trains", {
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
  customUserIds: jsonb("custom_user_ids").$type<string[]>(),
  includeCommunityTier: boolean("include_community_tier").default(false).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  daysAheadOpen: integer("days_ahead_open").default(30),
  availabilityStartDate: date("availability_start_date"),
  availabilityEndDate: date("availability_end_date"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("meal_trains_household_idx").on(table.householdId),
}));

export type MealTrain = typeof mealTrains.$inferSelect;
export type InsertMealTrain = typeof mealTrains.$inferInsert;

/**
 * Meal Signups - Individual meal delivery signups for specific dates
 */
export const mealSignups = pgTable("meal_signups", {
  id: serial("id").primaryKey(),
  mealTrainId: integer("meal_train_id").notNull(),
  userId: varchar("user_id").notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  status: mealSignupStatusEnum("status").default("confirmed").notNull(),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  mealTrainIdx: index("meal_signups_meal_train_idx").on(table.mealTrainId),
  userIdx: index("meal_signups_user_idx").on(table.userId),
  deliveryDateIdx: index("meal_signups_delivery_date_idx").on(table.deliveryDate),
}));

export type MealSignup = typeof mealSignups.$inferSelect;
export type InsertMealSignup = typeof mealSignups.$inferInsert;

/**
 * Meal Train Days - Individual day configurations for meal train availability
 */
export const mealTrainDays = pgTable("meal_train_days", {
  id: serial("id").primaryKey(),
  mealTrainId: integer("meal_train_id").notNull(),
  date: date("date").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  capacityOverride: integer("capacity_override"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  mealTrainDateIdx: uniqueIndex("meal_train_days_meal_train_date_idx").on(table.mealTrainId, table.date),
  mealTrainIdx: index("meal_train_days_meal_train_idx").on(table.mealTrainId),
  dateIdx: index("meal_train_days_date_idx").on(table.date),
}));

export type MealTrainDay = typeof mealTrainDays.$inferSelect;
export type InsertMealTrainDay = typeof mealTrainDays.$inferInsert;

/**
 * Notification Preferences - User preferences for which notifications to receive
 */
export const notificationPreferences = pgTable("notification_preferences", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: uniqueIndex("notification_preferences_user_idx").on(table.userId),
  householdIdx: index("notification_preferences_household_idx").on(table.householdId),
}));

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Push Subscriptions - Store browser push notification subscription data
 */
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("push_subscriptions_user_idx").on(table.userId),
  endpointIdx: uniqueIndex("push_subscriptions_endpoint_idx").on(table.endpoint),
}));

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Notification Logs - Track all notifications sent for debugging and analytics
 */
export const notificationLogs = pgTable("notification_logs", {
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
  error: text("error"),
}, (table) => ({
  userIdx: index("notification_logs_user_idx").on(table.userId),
  householdIdx: index("notification_logs_household_idx").on(table.householdId),
  sentAtIdx: index("notification_logs_sent_at_idx").on(table.sentAt),
  typeIdx: index("notification_logs_type_idx").on(table.notificationType),
}));

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;

/**
 * Reminders - User-specific reminders for needs and events
 * Stores reminder preferences and tracks sent status
 */
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  householdId: integer("household_id").notNull(),
  targetType: reminderTargetTypeEnum("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  reminderOffsetMinutes: integer("reminder_offset_minutes").notNull(),
  triggerAt: timestamp("trigger_at").notNull(),
  status: reminderStatusEnum("status").default("queued").notNull(),
  sentAt: timestamp("sent_at"),
  retryAt: timestamp("retry_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("reminders_user_idx").on(table.userId),
  householdIdx: index("reminders_household_idx").on(table.householdId),
  targetIdx: index("reminders_target_idx").on(table.targetType, table.targetId),
  statusTriggerIdx: index("reminders_status_trigger_idx").on(table.status, table.triggerAt),
}));

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

/**
 * Memory Wall - Collage of memories, stories, encouragement, prayers, and pictures
 */
export const memoryWall = pgTable("memory_wall", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  authorId: varchar("author_id").notNull(),
  type: memoryWallTypeEnum("type").notNull(),
  content: text("content"), // Text content for memory, story, encouragement, prayer
  imageUrl: text("image_url"), // For pictures
  imageUrls: jsonb("image_urls").$type<string[]>(), // Multiple images support
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("memory_wall_household_idx").on(table.householdId),
  typeIdx: index("memory_wall_type_idx").on(table.type),
  createdAtIdx: index("memory_wall_created_at_idx").on(table.createdAt),
}));

export type MemoryWallEntry = typeof memoryWall.$inferSelect;
export type InsertMemoryWallEntry = typeof memoryWall.$inferInsert;

/**
 * Memory Wall Positions - User-specific card positions for vision board layout
 */
export const memoryWallPositions = pgTable("memory_wall_positions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  householdId: integer("household_id").notNull(),
  memoryId: integer("memory_id").notNull(),
  x: integer("x").notNull(), // X position in pixels
  y: integer("y").notNull(), // Y position in pixels
  rotation: real("rotation").default(0).notNull(), // Rotation angle in degrees
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userMemoryIdx: uniqueIndex("memory_wall_positions_user_memory_idx").on(table.userId, table.householdId, table.memoryId),
  householdIdx: index("memory_wall_positions_household_idx").on(table.householdId),
}));

export type MemoryWallPosition = typeof memoryWallPositions.$inferSelect;
export type InsertMemoryWallPosition = typeof memoryWallPositions.$inferInsert;

/**
 * Gift Registry - Wishlist for family to share needed items
 */
export const giftRegistry = pgTable("gift_registry", {
  id: serial("id").primaryKey(),
  householdId: integer("household_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  url: text("url"), // Link to product page
  imageUrl: text("image_url"),
  price: varchar("price", { length: 100 }), // Store as string to handle various currencies/formats
  priority: priorityEnum("priority").default("normal").notNull(),
  status: giftStatusEnum("status").default("needed").notNull(),
  purchasedBy: varchar("purchased_by"), // User ID who purchased
  purchasedAt: timestamp("purchased_at"),
  notes: text("notes"), // Special instructions
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("gift_registry_household_idx").on(table.householdId),
  statusIdx: index("gift_registry_status_idx").on(table.status),
  priorityIdx: index("gift_registry_priority_idx").on(table.priority),
}));

export type GiftRegistryItem = typeof giftRegistry.$inferSelect;
export type InsertGiftRegistryItem = typeof giftRegistry.$inferInsert;

/**
 * Onboarding Tours - Lookup table for available tours
 */
export const onboardingTours = pgTable("onboarding_tours", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).unique().notNull(), // e.g., "household.setup.v1", "needs.board.admin.v1"
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  scope: tourScopeEnum("scope").notNull(), // household, feature, help
  roleAccess: jsonb("role_access").$type<string[]>().default(["admin", "primary", "supporter"]).notNull(), // Which roles can see this tour
  version: integer("version").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: index("onboarding_tours_slug_idx").on(table.slug),
  scopeIdx: index("onboarding_tours_scope_idx").on(table.scope),
}));

export type OnboardingTour = typeof onboardingTours.$inferSelect;
export type InsertOnboardingTour = typeof onboardingTours.$inferInsert;

/**
 * User Tour Progress - Tracks which tours users have completed
 */
export const userTourProgress = pgTable("user_tour_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  householdId: integer("household_id").notNull(),
  tourId: integer("tour_id").notNull(),
  status: tourStatusEnum("status").default("not_started").notNull(),
  lastStep: integer("last_step").default(0),
  completedAt: timestamp("completed_at"),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userTourIdx: uniqueIndex("user_tour_progress_user_tour_idx").on(table.userId, table.householdId, table.tourId),
  statusIdx: index("user_tour_progress_status_idx").on(table.status),
}));

export type UserTourProgress = typeof userTourProgress.$inferSelect;
export type InsertUserTourProgress = typeof userTourProgress.$inferInsert;
