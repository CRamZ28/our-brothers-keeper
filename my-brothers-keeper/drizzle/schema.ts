import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role and household support for My Brother's Keeper.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["primary", "admin", "supporter", "user"]).default("user").notNull(),
  householdId: int("householdId"),
  status: mysqlEnum("status", ["active", "pending", "blocked"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("household_idx").on(table.householdId),
  statusIdx: index("status_idx").on(table.status),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Households - the core organizational unit
 */
export const households = mysqlTable("households", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  primaryUserId: int("primaryUserId").notNull(),
  quietMode: boolean("quietMode").default(false).notNull(),
  timezone: varchar("timezone", { length: 64 }).default("America/Chicago").notNull(),
  delegateAdminApprovals: boolean("delegateAdminApprovals").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  primaryUserIdx: index("primary_user_idx").on(table.primaryUserId),
}));

export type Household = typeof households.$inferSelect;
export type InsertHousehold = typeof households.$inferInsert;

/**
 * Groups - visibility groups per household (Inner Circle, Immediate Family, etc.)
 */
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("household_idx").on(table.householdId),
}));

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

/**
 * Group Members - junction table for users in groups
 */
export const groupMembers = mysqlTable("group_members", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  groupUserIdx: uniqueIndex("group_user_idx").on(table.groupId, table.userId),
  userIdx: index("user_idx").on(table.userId),
}));

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;

/**
 * Invites - for inviting supporters to join a household
 */
export const invites = mysqlTable("invites", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  invitedEmail: varchar("invitedEmail", { length: 320 }),
  invitedPhone: varchar("invitedPhone", { length: 20 }),
  invitedRole: mysqlEnum("invitedRole", ["admin", "supporter"]).notNull(),
  inviterUserId: int("inviterUserId").notNull(),
  status: mysqlEnum("status", ["sent", "accepted", "revoked", "expired"]).default("sent").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, (table) => ({
  householdIdx: index("household_idx").on(table.householdId),
  tokenIdx: index("token_idx").on(table.token),
  statusIdx: index("status_idx").on(table.status),
}));

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = typeof invites.$inferInsert;

/**
 * Events - calendar events for the household
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startAt: timestamp("startAt").notNull(),
  endAt: timestamp("endAt"),
  location: varchar("location", { length: 500 }),
  createdBy: int("createdBy").notNull(),
  googleCalendarEvtId: varchar("googleCalendarEvtId", { length: 255 }),
  visibilityScope: mysqlEnum("visibilityScope", ["private", "all_supporters", "group", "role"]).default("all_supporters").notNull(),
  visibilityGroupId: int("visibilityGroupId"),
  minRole: mysqlEnum("minRole", ["supporter", "admin", "primary"]),
  capacity: int("capacity"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  householdIdx: index("household_idx").on(table.householdId),
  startAtIdx: index("start_at_idx").on(table.startAt),
  visibilityIdx: index("visibility_idx").on(table.visibilityScope),
}));

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Event RSVPs - track who's attending events
 */
export const eventRsvps = mysqlTable("event_rsvps", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["going", "maybe", "declined"]).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  eventUserIdx: uniqueIndex("event_user_idx").on(table.eventId, table.userId),
  userIdx: index("user_idx").on(table.userId),
}));

export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = typeof eventRsvps.$inferInsert;

/**
 * Needs - help board items (meals, rides, errands, etc.)
 */
export const needs = mysqlTable("needs", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  details: text("details"),
  category: mysqlEnum("category", ["meals", "rides", "errands", "childcare", "household", "other"]).notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "urgent"]).default("normal").notNull(),
  dueAt: timestamp("dueAt"),
  recurrence: varchar("recurrence", { length: 255 }), // iCal RRULE format
  createdBy: int("createdBy").notNull(),
  visibilityScope: mysqlEnum("visibilityScope", ["private", "all_supporters", "group", "role"]).default("all_supporters").notNull(),
  visibilityGroupId: int("visibilityGroupId"),
  status: mysqlEnum("status", ["open", "claimed", "completed", "cancelled"]).default("open").notNull(),
  capacity: int("capacity"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  householdIdx: index("household_idx").on(table.householdId),
  statusIdx: index("status_idx").on(table.status),
  categoryIdx: index("category_idx").on(table.category),
  dueAtIdx: index("due_at_idx").on(table.dueAt),
}));

export type Need = typeof needs.$inferSelect;
export type InsertNeed = typeof needs.$inferInsert;

/**
 * Need Claims - track who claimed which needs
 */
export const needClaims = mysqlTable("need_claims", {
  id: int("id").autoincrement().primaryKey(),
  needId: int("needId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["claimed", "completed", "released"]).default("claimed").notNull(),
  note: text("note"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  needIdx: index("need_idx").on(table.needId),
  userIdx: index("user_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
}));

export type NeedClaim = typeof needClaims.$inferSelect;
export type InsertNeedClaim = typeof needClaims.$inferInsert;

/**
 * Messages - DM/group/broadcast messaging
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  threadId: varchar("threadId", { length: 64 }),
  senderUserId: int("senderUserId").notNull(),
  body: text("body").notNull(),
  visibilityScope: mysqlEnum("visibilityScope", ["private", "all_supporters", "group", "role"]).default("all_supporters").notNull(),
  visibilityGroupId: int("visibilityGroupId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("household_idx").on(table.householdId),
  threadIdx: index("thread_idx").on(table.threadId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Announcements - broadcast messages from Primary/Admin
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  pinned: boolean("pinned").default(false).notNull(),
  createdBy: int("createdBy").notNull(),
  visibilityScope: mysqlEnum("visibilityScope", ["private", "all_supporters", "group", "role"]).default("all_supporters").notNull(),
  visibilityGroupId: int("visibilityGroupId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  householdIdx: index("household_idx").on(table.householdId),
  pinnedIdx: index("pinned_idx").on(table.pinned),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Updates - personal updates from Primary with photos
 */
export const updates = mysqlTable("updates", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  authorId: int("authorId").notNull(),
  type: mysqlEnum("type", ["general", "gratitude", "memory", "milestone"]).default("general").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  photoUrls: json("photoUrls").$type<string[] | null>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  householdIdx: index("household_idx").on(table.householdId),
  authorIdx: index("author_idx").on(table.authorId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type Update = typeof updates.$inferSelect;
export type InsertUpdate = typeof updates.$inferInsert;

/**
 * Notification Preferences - per-user notification settings
 */
export const notificationPrefs = mysqlTable("notification_prefs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  channelEmail: boolean("channelEmail").default(true).notNull(),
  channelSms: boolean("channelSms").default(false).notNull(),
  channelPush: boolean("channelPush").default(true).notNull(),
  digestFrequency: mysqlEnum("digestFrequency", ["immediate", "daily", "weekly"]).default("daily").notNull(),
  urgentNeedsAlerts: boolean("urgentNeedsAlerts").default(true).notNull(),
  quietHours: json("quietHours").$type<{ start: string; end: string } | null>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type NotificationPref = typeof notificationPrefs.$inferSelect;
export type InsertNotificationPref = typeof notificationPrefs.$inferInsert;

/**
 * Admin Messages - messages sent by admins to supporters
 */
export const adminMessages = mysqlTable("admin_messages", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  senderId: int("senderId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  recipientType: mysqlEnum("recipientType", ["individual", "group", "all"]).notNull(),
  recipientGroupId: int("recipientGroupId"),
  includedPrimary: boolean("includedPrimary").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("household_idx").on(table.householdId),
  senderIdx: index("sender_idx").on(table.senderId),
}));

export type AdminMessage = typeof adminMessages.$inferSelect;
export type InsertAdminMessage = typeof adminMessages.$inferInsert;

/**
 * Admin Message Recipients - tracks who received each admin message
 */
export const adminMessageRecipients = mysqlTable("admin_message_recipients", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  messageIdx: index("message_idx").on(table.messageId),
  userIdx: index("user_idx").on(table.userId),
}));

export type AdminMessageRecipient = typeof adminMessageRecipients.$inferSelect;
export type InsertAdminMessageRecipient = typeof adminMessageRecipients.$inferInsert;

/**
 * Admin Groups - custom groups created by admins for targeted communication
 */
export const adminGroups = mysqlTable("admin_groups", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  createdBy: int("createdBy").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  householdIdx: index("household_idx").on(table.householdId),
}));

export type AdminGroup = typeof adminGroups.$inferSelect;
export type InsertAdminGroup = typeof adminGroups.$inferInsert;

/**
 * Admin Group Members - members of admin-created groups
 */
export const adminGroupMembers = mysqlTable("admin_group_members", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
}, (table) => ({
  groupIdx: index("group_idx").on(table.groupId),
  userIdx: index("user_idx").on(table.userId),
  groupUserIdx: uniqueIndex("group_user_idx").on(table.groupId, table.userId),
}));

export type AdminGroupMember = typeof adminGroupMembers.$inferSelect;
export type InsertAdminGroupMember = typeof adminGroupMembers.$inferInsert;

/**
 * Audit Logs - track all important actions for transparency
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  householdId: int("householdId").notNull(),
  actorUserId: int("actorUserId").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  targetType: varchar("targetType", { length: 64 }).notNull(),
  targetId: int("targetId").notNull(),
  metadata: json("metadata").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  householdIdx: index("household_idx").on(table.householdId),
  actorIdx: index("actor_idx").on(table.actorUserId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

