import { and, eq, inArray, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  InsertUser,
  UpsertUser,
  users,
  households,
  InsertHousehold,
  groups,
  InsertGroup,
  groupMembers,
  InsertGroupMember,
  invites,
  InsertInvite,
  events,
  InsertEvent,
  eventRsvps,
  InsertEventRsvp,
  needs,
  InsertNeed,
  needClaims,
  InsertNeedClaim,
  messages,
  InsertMessage,
  announcements,
  InsertAnnouncement,
  notificationPrefs,
  InsertNotificationPref,
  auditLogs,
  InsertAuditLog,
  adminMessages,
  InsertAdminMessage,
  adminMessageRecipients,
  InsertAdminMessageRecipient,
  adminGroups,
  InsertAdminGroup,
  adminGroupMembers,
  InsertAdminGroupMember,
  updates,
  InsertUpdate,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

const { Pool } = pg;

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User id is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "phone", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.id === ENV.ownerId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (user.householdId !== undefined) {
      values.householdId = user.householdId;
      updateSet.householdId = user.householdId;
    }
    if (user.status !== undefined) {
      values.status = user.status;
      updateSet.status = user.status;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.id,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUsersByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).where(eq(users.householdId, householdId));
}

export async function updateUserStatus(userId: string, status: "active" | "pending" | "blocked") {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ status }).where(eq(users.id, userId));
}

// ============================================================================
// HOUSEHOLD MANAGEMENT
// ============================================================================

export async function createHousehold(household: InsertHousehold) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(households).values(household).returning({ id: households.id });
  return result[0].id;
}

export async function getHousehold(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(households).where(eq(households.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateHousehold(id: number, data: Partial<InsertHousehold>) {
  const db = await getDb();
  if (!db) return;

  await db.update(households).set(data).where(eq(households.id, id));
}

// ============================================================================
// GROUP MANAGEMENT
// ============================================================================

export async function createGroup(group: InsertGroup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(groups).values(group).returning({ id: groups.id });
  return result[0].id;
}

export async function getGroupsByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(groups).where(eq(groups.householdId, householdId));
}

export async function addUserToGroup(groupId: number, userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(groupMembers).values({ groupId, userId });
}

export async function removeUserFromGroup(groupId: number, userId: string) {
  const db = await getDb();
  if (!db) return;

  await db.delete(groupMembers).where(
    and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))
  );
}

export async function getUserGroups(userId: string, householdId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({ group: groups })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(and(eq(groupMembers.userId, userId), eq(groups.householdId, householdId)));

  return result.map((r) => r.group);
}

// ============================================================================
// INVITE MANAGEMENT
// ============================================================================

export async function createInvite(invite: InsertInvite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(invites).values(invite).returning({ id: invites.id });
  return result[0].id;
}

export async function getInviteByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(invites).where(eq(invites.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateInviteStatus(
  id: number,
  status: "sent" | "accepted" | "revoked" | "expired"
) {
  const db = await getDb();
  if (!db) return;

  await db.update(invites).set({ status }).where(eq(invites.id, id));
}

export async function getPendingInvitesByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(invites)
    .where(and(eq(invites.householdId, householdId), eq(invites.status, "sent")));
}

export async function getInviteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(invites).where(eq(invites.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateInvite(
  id: number,
  data: { token?: string; expiresAt?: Date; status?: "sent" | "accepted" | "revoked" | "expired" }
) {
  const db = await getDb();
  if (!db) return;

  await db.update(invites).set(data).where(eq(invites.id, id));
}

// ============================================================================
// EVENT MANAGEMENT
// ============================================================================

export async function createEvent(event: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(events).values(event).returning({ id: events.id });
  return result[0].id;
}

export async function getEventsByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get events with RSVP counts
  const eventsWithRsvps = await db
    .select({
      event: events,
      rsvp: eventRsvps,
    })
    .from(events)
    .leftJoin(eventRsvps, eq(events.id, eventRsvps.eventId))
    .where(eq(events.householdId, householdId));

  // Group by event and count "going" RSVPs
  const eventsMap = new Map();
  for (const row of eventsWithRsvps) {
    const eventId = row.event.id;
    if (!eventsMap.has(eventId)) {
      eventsMap.set(eventId, {
        ...row.event,
        goingCount: 0,
      });
    }
    if (row.rsvp?.status === "going") {
      eventsMap.get(eventId).goingCount++;
    }
  }

  return Array.from(eventsMap.values());
}

export async function getEvent(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) return;

  await db.update(events).set(data).where(eq(events.id, id));
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(events).where(eq(events.id, id));
}

// ============================================================================
// NEED MANAGEMENT
// ============================================================================

export async function createNeed(need: InsertNeed) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(needs).values(need).returning({ id: needs.id });
  return result[0].id;
}

export async function getNeedsByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all needs with their claims and claimer info
  const needsWithClaims = await db
    .select({
      need: needs,
      claim: needClaims,
      claimer: users,
    })
    .from(needs)
    .leftJoin(needClaims, eq(needs.id, needClaims.needId))
    .leftJoin(users, eq(needClaims.userId, users.id))
    .where(eq(needs.householdId, householdId));

  // Group by need and attach claimer info and count claims
  const needsMap = new Map();
  for (const row of needsWithClaims) {
    const needId = row.need.id;
    if (!needsMap.has(needId)) {
      needsMap.set(needId, {
        ...row.need,
        claimedByName: row.claimer?.name || null,
        claimedByUserId: row.claimer?.id || null,
        claimCount: 0,
      });
    }
    if (row.claim) {
      needsMap.get(needId).claimCount++;
      // For single-claim needs, store the claimer name
      if (!needsMap.get(needId).claimedByName && row.claimer) {
        needsMap.get(needId).claimedByName = row.claimer.name;
        needsMap.get(needId).claimedByUserId = row.claimer.id;
      }
    }
  }

  const allNeeds = Array.from(needsMap.values());
  
  // Sort completed needs by completedAt (most recent first)
  return allNeeds.sort((a, b) => {
    if (a.completedAt && b.completedAt) {
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    }
    return 0;
  });
}

export async function getNeed(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(needs).where(eq(needs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateNeed(id: number, data: Partial<InsertNeed>) {
  const db = await getDb();
  if (!db) return;

  await db.update(needs).set(data).where(eq(needs.id, id));
}

export async function deleteNeed(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(needs).where(eq(needs.id, id));
}

// ============================================================================
// NEED CLAIM MANAGEMENT
// ============================================================================

export async function createNeedClaim(claim: InsertNeedClaim) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(needClaims).values(claim).returning({ id: needClaims.id });
  return result[0].id;
}

export async function getClaimsByNeed(needId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(needClaims).where(eq(needClaims.needId, needId));
}

export async function getNeedClaim(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(needClaims).where(eq(needClaims.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateNeedClaim(
  id: number,
  data: Partial<Omit<InsertNeedClaim, "needId" | "userId">>
) {
  const db = await getDb();
  if (!db) return;

  await db.update(needClaims).set(data).where(eq(needClaims.id, id));
}

// ============================================================================
// ANNOUNCEMENT MANAGEMENT
// ============================================================================

export async function createAnnouncement(announcement: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(announcements).values(announcement).returning({ id: announcements.id });
  return result[0].id;
}

export async function getAnnouncementsByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(announcements).where(eq(announcements.householdId, householdId));
}

export async function updateAnnouncement(id: number, data: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) return;

  await db.update(announcements).set(data).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(announcements).where(eq(announcements.id, id));
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(auditLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to create audit log:", error);
  }
}

export async function getAuditLogsByHousehold(householdId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.householdId, householdId))
    .orderBy(auditLogs.createdAt)
    .limit(limit);
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export async function getOrCreateNotificationPrefs(userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create default preferences
  await db.insert(notificationPrefs).values({ userId });

  const created = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1);

  return created[0];
}

export async function getNotificationPrefs(userId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateNotificationPrefs(userId: string, data: Partial<InsertNotificationPref>) {
  const db = await getDb();
  if (!db) return;

  await db.update(notificationPrefs).set(data).where(eq(notificationPrefs.userId, userId));
}

export async function upsertNotificationPrefs(userId: string, data: Partial<InsertNotificationPref>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if preferences exist
  const existing = await db
    .select()
    .from(notificationPrefs)
    .where(eq(notificationPrefs.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db.update(notificationPrefs).set(data).where(eq(notificationPrefs.userId, userId));
  } else {
    // Create new
    await db.insert(notificationPrefs).values({ userId, ...data });
  }
}



// ============================================================================
// RSVP MANAGEMENT
// ============================================================================

export async function upsertRsvp(rsvp: InsertEventRsvp) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if RSVP already exists
  const existing = await db
    .select()
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, rsvp.eventId), eq(eventRsvps.userId, rsvp.userId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing RSVP
    await db
      .update(eventRsvps)
      .set({ status: rsvp.status })
      .where(eq(eventRsvps.id, existing[0].id));
    return existing[0].id;
  } else {
    // Create new RSVP
    const result = await db.insert(eventRsvps).values(rsvp).returning({ id: eventRsvps.id });
    return result[0].id;
  }
}

export async function getRsvpsByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      rsvp: eventRsvps,
      user: users,
    })
    .from(eventRsvps)
    .innerJoin(users, eq(eventRsvps.userId, users.id))
    .where(eq(eventRsvps.eventId, eventId));
}

export async function getUserRsvp(eventId: number, userId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}



// ============================================================================
// RECENT ACTIVITY
// ============================================================================

export async function getRecentActivity(householdId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  const logs = await db
    .select({
      log: auditLogs,
      actor: users,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorUserId, users.id))
    .where(eq(auditLogs.householdId, householdId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return logs.map((row) => ({
    id: row.log.id,
    action: row.log.action,
    actorName: row.actor?.name || null,
    createdAt: row.log.createdAt,
    metadata: row.log.metadata,
  }));
}



// ============================================================================
// ADMIN MESSAGES
// ============================================================================

export async function createAdminMessage(message: InsertAdminMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(adminMessages).values(message).returning({ id: adminMessages.id });
  return result[0].id;
}

export async function createAdminMessageRecipient(recipient: InsertAdminMessageRecipient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(adminMessageRecipients).values(recipient);
}

export async function getAdminMessagesByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(adminMessages)
    .where(eq(adminMessages.householdId, householdId))
    .orderBy(desc(adminMessages.createdAt));
}

// ============================================================================
// ADMIN GROUPS
// ============================================================================

export async function createAdminGroup(group: InsertAdminGroup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(adminGroups).values(group).returning({ id: adminGroups.id });
  return result[0].id;
}

export async function addAdminGroupMember(member: InsertAdminGroupMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(adminGroupMembers).values(member);
}

export async function getAdminGroupsByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) return [];

  const groups = await db
    .select({
      group: adminGroups,
    })
    .from(adminGroups)
    .where(eq(adminGroups.householdId, householdId))
    .orderBy(desc(adminGroups.createdAt));

  // Get member counts for each group
  const result = [];
  for (const { group } of groups) {
    const members = await db
      .select()
      .from(adminGroupMembers)
      .where(eq(adminGroupMembers.groupId, group.id));

    result.push({
      ...group,
      memberCount: members.length,
    });
  }

  return result;
}

export async function getAdminGroup(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(adminGroups).where(eq(adminGroups.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAdminGroupMembers(groupId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(adminGroupMembers).where(eq(adminGroupMembers.groupId, groupId));
}

export async function deleteAdminGroup(id: number) {
  const db = await getDb();
  if (!db) return;

  // Delete members first
  await db.delete(adminGroupMembers).where(eq(adminGroupMembers.groupId, id));
  // Delete group
  await db.delete(adminGroups).where(eq(adminGroups.id, id));
}



// ============================================================================
// UPDATES
// ============================================================================

export async function createUpdate(update: InsertUpdate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(updates).values(update).returning({ id: updates.id });
  return result[0].id;
}

export async function getUpdatesByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      update: updates,
      author: users,
    })
    .from(updates)
    .leftJoin(users, eq(updates.authorId, users.id))
    .where(eq(updates.householdId, householdId))
    .orderBy(desc(updates.createdAt));

  return results.map(({ update, author }) => ({
    ...update,
    authorName: author?.name || author?.email || "Unknown",
  }));
}

export async function getUpdate(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(updates).where(eq(updates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteUpdate(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(updates).where(eq(updates.id, id));
}

