import { and, eq, inArray, desc, sql, ilike } from "drizzle-orm";
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
  mealTrains,
  InsertMealTrain,
  mealSignups,
  InsertMealSignup,
  mealTrainDays,
  InsertMealTrainDay,
  memoryWall,
  InsertMemoryWallEntry,
  memoryWallPositions,
  InsertMemoryWallPosition,
  giftRegistry,
  InsertGiftRegistryItem,
  questionReplies,
  InsertQuestionReply,
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

export async function updateUserProfile(userId: string, data: Partial<Pick<InsertUser, "name" | "phone" | "profileImageUrl">>) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function removeUserFromHousehold(userId: string, householdId: number) {
  const db = await getDb();
  if (!db) return;

  // Get the user to verify household membership
  const targetUser = await getUserById(userId);
  if (!targetUser) {
    throw new Error("User not found");
  }

  // CRITICAL: Verify user belongs to the specified household before removing
  if (targetUser.householdId !== householdId) {
    throw new Error("User does not belong to this household");
  }

  // Remove user from all groups in this household
  const userGroups = await getUserGroups(userId, householdId);
  for (const group of userGroups) {
    await removeUserFromGroup(group.id, userId);
  }

  // Set user's household to null and status to blocked
  await db.update(users).set({ 
    householdId: null,
    status: "blocked"
  }).where(eq(users.id, userId));
}

export async function getUsersPendingTierApproval(householdId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.householdId, householdId),
        sql`${users.requestedTier} IS NOT NULL`,
        sql`${users.requestedTier} != ${users.accessTier}`
      )
    );

  return result;
}

export async function updateUserAccessTier(userId: string, tier: "community" | "friend" | "family") {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ 
    accessTier: tier,
    requestedTier: null,
    updatedAt: new Date()
  }).where(eq(users.id, userId));
}

export async function joinHouseholdWithTier(
  userId: string, 
  householdId: number, 
  requestedTier: "community" | "friend" | "family"
) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({
    householdId,
    accessTier: "community",
    requestedTier,
    tierRequestedAt: new Date(),
    role: "supporter",
    status: "active",
    updatedAt: new Date()
  }).where(eq(users.id, userId));
}

// ============================================================================
// HOUSEHOLD MANAGEMENT
// ============================================================================

export async function createHousehold(household: InsertHousehold) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Auto-generate a slug if not provided
  if (!household.slug) {
    household.slug = await generateUniqueSlug(household.name);
  }

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

export async function updateHouseholdAutoPromote(
  householdId: number,
  settings: { autoPromoteEnabled?: boolean; autoPromoteHours?: number }
) {
  const db = await getDb();
  if (!db) return;

  await db.update(households).set({
    ...settings,
    updatedAt: new Date()
  }).where(eq(households.id, householdId));
}

// Slug utilities
export function generateSlug(name: string): string {
  // Normalize accented characters to their base form
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  let slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ''); // Remove all non-alphanumeric characters
  
  // If slug is empty (e.g., all emoji or special chars), use "family" as fallback
  if (!slug || slug.length === 0) {
    slug = 'family';
  }
  
  return slug;
}

export async function searchHouseholds(query: string) {
  const db = await getDb();
  if (!db) return [];

  // Use ILIKE for case-insensitive partial matching
  const searchPattern = `%${query}%`;
  const result = await db
    .select()
    .from(households)
    .where(ilike(households.name, searchPattern))
    .limit(20)
    .orderBy(households.name);
  
  return result;
}

export async function getHouseholdBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(households).where(eq(households.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function isSlugAvailable(slug: string, excludeHouseholdId?: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available - cannot check slug availability");
  }

  const conditions = excludeHouseholdId 
    ? and(eq(households.slug, slug), sql`${households.id} != ${excludeHouseholdId}`)
    : eq(households.slug, slug);
    
  const result = await db.select({ id: households.id }).from(households).where(conditions).limit(1);
  return result.length === 0;
}

export async function generateUniqueSlug(baseName: string, excludeHouseholdId?: number): Promise<string> {
  const MAX_SLUG_LENGTH = 250; // Reserve 5 chars for numeric suffix
  
  let baseSlug = generateSlug(baseName);
  // Truncate base slug to ensure room for numeric suffixes
  if (baseSlug.length > MAX_SLUG_LENGTH) {
    baseSlug = baseSlug.substring(0, MAX_SLUG_LENGTH);
  }
  
  let slug = baseSlug;
  let counter = 1;
  
  while (!(await isSlugAvailable(slug, excludeHouseholdId))) {
    slug = `${baseSlug}${counter}`;
    counter++;
    
    // Safety check - prevent infinite loops
    if (counter > 10000) {
      throw new Error(`Unable to generate unique slug for "${baseName}" after 10000 attempts`);
    }
  }
  
  return slug;
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

  const result = await db
    .select({
      id: groups.id,
      householdId: groups.householdId,
      name: groups.name,
      description: groups.description,
      createdAt: groups.createdAt,
      memberCount: sql<number>`count(${groupMembers.userId})::int`,
    })
    .from(groups)
    .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(eq(groups.householdId, householdId))
    .groupBy(groups.id);

  return result;
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

export async function updateGroup(groupId: number, data: { name?: string; description?: string | null }) {
  const db = await getDb();
  if (!db) return;

  await db.update(groups).set(data).where(eq(groups.id, groupId));
}

export async function deleteGroup(groupId: number) {
  const db = await getDb();
  if (!db) return;

  // First delete all group members
  await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
  
  // Then delete the group
  await db.delete(groups).where(eq(groups.id, groupId));
}

export async function getGroupMembers(groupId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({ user: users })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));

  return result.map((r) => r.user);
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

export async function getEventsByHousehold(householdId: number, userId?: string) {
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

  // Group by event and count "going" RSVPs, track user's RSVP status
  const eventsMap = new Map();
  for (const row of eventsWithRsvps) {
    const eventId = row.event.id;
    if (!eventsMap.has(eventId)) {
      eventsMap.set(eventId, {
        ...row.event,
        goingCount: 0,
        userRsvpStatus: null as string | null,
      });
    }
    if (row.rsvp?.status === "going") {
      eventsMap.get(eventId).goingCount++;
    }
    // Track current user's RSVP status
    if (userId && row.rsvp?.userId === userId) {
      eventsMap.get(eventId).userRsvpStatus = row.rsvp.status;
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
        claims: [], // Store all claims for this need
      });
    }
    if (row.claim) {
      needsMap.get(needId).claimCount++;
      // Store the claim details
      needsMap.get(needId).claims.push({
        id: row.claim.id,
        userId: row.claim.userId,
        status: row.claim.status,
        note: row.claim.note,
        createdAt: row.claim.createdAt,
      });
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

export async function getQuestionsByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(announcements)
    .where(and(
      eq(announcements.householdId, householdId),
      eq(announcements.isQuestion, true)
    ))
    .orderBy(desc(announcements.createdAt));
}

export async function markQuestionAsRead(questionId: number, userId: string) {
  const db = await getDb();
  if (!db) return;

  const question = await db.select().from(announcements).where(eq(announcements.id, questionId)).limit(1);
  if (question.length === 0) return;

  const readBy = question[0].readBy || [];
  if (!readBy.includes(userId)) {
    await db.update(announcements)
      .set({ readBy: [...readBy, userId] })
      .where(eq(announcements.id, questionId));
  }
}

export async function getUnreadQuestionCount(householdId: number, userId: string) {
  const db = await getDb();
  if (!db) return 0;

  const questions = await db
    .select()
    .from(announcements)
    .where(and(
      eq(announcements.householdId, householdId),
      eq(announcements.isQuestion, true)
    ));

  return questions.filter(q => !q.readBy?.includes(userId)).length;
}

// ============================================================================
// QUESTION REPLIES
// ============================================================================

export async function createQuestionReply(reply: InsertQuestionReply) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(questionReplies).values(reply).returning({ id: questionReplies.id });
  return result[0].id;
}

export async function getQuestionReplies(questionId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(questionReplies)
    .where(eq(questionReplies.questionId, questionId))
    .orderBy(questionReplies.createdAt);
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

// ============================================================================
// MEAL TRAIN MANAGEMENT
// ============================================================================

export async function getMealTrainByHousehold(householdId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(mealTrains)
    .where(eq(mealTrains.householdId, householdId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createMealTrain(mealTrain: InsertMealTrain) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(mealTrains).values(mealTrain).returning({ id: mealTrains.id });
  return result[0].id;
}

export async function updateMealTrain(id: number, data: Partial<InsertMealTrain>) {
  const db = await getDb();
  if (!db) return;

  await db.update(mealTrains).set({ ...data, updatedAt: new Date() }).where(eq(mealTrains.id, id));
}

export async function getMealSignupsByMealTrain(mealTrainId: number) {
  const db = await getDb();
  if (!db) return [];

  const signups = await db
    .select()
    .from(mealSignups)
    .where(eq(mealSignups.mealTrainId, mealTrainId))
    .orderBy(mealSignups.deliveryDate);

  const userIds = signups.map((s) => s.userId).filter((id) => id != null);
  const signupUsers =
    userIds.length > 0 ? await db.select().from(users).where(inArray(users.id, userIds)) : [];

  return signups.map((signup) => {
    const user = signupUsers.find((u) => u.id === signup.userId);
    return {
      ...signup,
      userName: user?.name || user?.email || "Unknown",
      userEmail: user?.email || "",
    };
  });
}

export async function createMealSignup(signup: InsertMealSignup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(mealSignups).values(signup).returning({ id: mealSignups.id });
  return result[0].id;
}

export async function getMealSignup(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(mealSignups).where(eq(mealSignups.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateMealSignup(id: number, data: Partial<InsertMealSignup>) {
  const db = await getDb();
  if (!db) return;

  await db.update(mealSignups).set({ ...data, updatedAt: new Date() }).where(eq(mealSignups.id, id));
}

export async function deleteMealSignup(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(mealSignups).where(eq(mealSignups.id, id));
}

// Save meal train days
export async function saveMealTrainDays(mealTrainId: number, dates: Date[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete existing days for this meal train
  await db.delete(mealTrainDays).where(eq(mealTrainDays.mealTrainId, mealTrainId));

  // Insert new days
  if (dates.length > 0) {
    await db.insert(mealTrainDays).values(
      dates.map(date => ({
        mealTrainId,
        date: date.toISOString().split('T')[0],
        isAvailable: true,
      }))
    );
  }
}

// Get meal train days
export async function getMealTrainDays(mealTrainId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(mealTrainDays)
    .where(eq(mealTrainDays.mealTrainId, mealTrainId))
    .orderBy(mealTrainDays.date);
}

// Check if a specific day is available
export async function isMealDayAvailable(mealTrainId: number, date: string) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(mealTrainDays)
    .where(
      and(
        eq(mealTrainDays.mealTrainId, mealTrainId),
        eq(mealTrainDays.date, date),
        eq(mealTrainDays.isAvailable, true)
      )
    )
    .limit(1);

  return result.length > 0;
}

// ============================================================================
// Memory Wall Functions
// ============================================================================

// Create memory wall entry
export async function createMemoryWallEntry(entry: InsertMemoryWallEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const result = await db.insert(memoryWall).values(entry).returning();
  return result[0].id;
}

// Get memory wall entries with optional type filter
export async function getMemoryWallEntries(householdId: number, type?: "memory" | "story" | "encouragement" | "prayer" | "picture") {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(memoryWall.householdId, householdId)];
  if (type) {
    conditions.push(eq(memoryWall.type, type));
  }

  return await db
    .select({
      id: memoryWall.id,
      householdId: memoryWall.householdId,
      authorId: memoryWall.authorId,
      type: memoryWall.type,
      content: memoryWall.content,
      imageUrl: memoryWall.imageUrl,
      imageUrls: memoryWall.imageUrls,
      createdAt: memoryWall.createdAt,
      updatedAt: memoryWall.updatedAt,
      authorName: users.name,
    })
    .from(memoryWall)
    .leftJoin(users, eq(memoryWall.authorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(memoryWall.createdAt));
}

// Get single memory wall entry
export async function getMemoryWallEntry(entryId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(memoryWall)
    .where(eq(memoryWall.id, entryId))
    .limit(1);

  return result[0] || null;
}

// Delete memory wall entry
export async function deleteMemoryWallEntry(entryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  await db.delete(memoryWall).where(eq(memoryWall.id, entryId));
}

// Update memory wall entry
export async function updateMemoryWallEntry(
  entryId: number, 
  updates: {
    type?: "memory" | "story" | "encouragement" | "prayer" | "picture";
    content?: string;
    imageUrl?: string;
    imageUrls?: string[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const updateData: any = { updatedAt: new Date() };
  
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
  if (updates.imageUrls !== undefined) updateData.imageUrls = updates.imageUrls;

  await db
    .update(memoryWall)
    .set(updateData)
    .where(eq(memoryWall.id, entryId));
}

// Get user-specific positions for memory wall cards
export async function getMemoryWallPositions(userId: string, householdId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(memoryWallPositions)
    .where(
      and(
        eq(memoryWallPositions.userId, userId),
        eq(memoryWallPositions.householdId, householdId)
      )
    );
}

// Save or update memory wall card position
export async function saveMemoryWallPosition(position: InsertMemoryWallPosition) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  // Check if position already exists
  const existing = await db
    .select()
    .from(memoryWallPositions)
    .where(
      and(
        eq(memoryWallPositions.userId, position.userId),
        eq(memoryWallPositions.householdId, position.householdId),
        eq(memoryWallPositions.memoryId, position.memoryId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing position
    await db
      .update(memoryWallPositions)
      .set({
        x: position.x,
        y: position.y,
        rotation: position.rotation,
        updatedAt: new Date(),
      })
      .where(eq(memoryWallPositions.id, existing[0].id));
  } else {
    // Insert new position
    await db.insert(memoryWallPositions).values(position);
  }
}

// ============================================================================
// Gift Registry Functions
// ============================================================================

// Create gift registry item
export async function createGiftRegistryItem(item: InsertGiftRegistryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const result = await db.insert(giftRegistry).values(item).returning();
  return result[0].id;
}

// Get all gift registry items for household
export async function getGiftRegistryItems(householdId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
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
      purchaserName: users.name,
    })
    .from(giftRegistry)
    .leftJoin(users, eq(giftRegistry.purchasedBy, users.id))
    .where(eq(giftRegistry.householdId, householdId))
    .orderBy(
      desc(sql`CASE WHEN ${giftRegistry.priority} = 'urgent' THEN 1 WHEN ${giftRegistry.priority} = 'normal' THEN 2 ELSE 3 END`),
      giftRegistry.createdAt
    );
}

// Get single gift registry item
export async function getGiftRegistryItem(itemId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(giftRegistry)
    .where(eq(giftRegistry.id, itemId))
    .limit(1);

  return result[0] || null;
}

// Update gift registry item
export async function updateGiftRegistryItem(
  itemId: number,
  updates: Partial<InsertGiftRegistryItem>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  // Filter out undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  ) as Partial<InsertGiftRegistryItem>;

  await db
    .update(giftRegistry)
    .set({ ...cleanUpdates, updatedAt: new Date() })
    .where(eq(giftRegistry.id, itemId));
}

// Mark gift as purchased
export async function markGiftPurchased(itemId: number, userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  await db
    .update(giftRegistry)
    .set({
      status: "purchased",
      purchasedBy: userId,
      purchasedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(giftRegistry.id, itemId));
}

// Mark gift as received
export async function markGiftReceived(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  await db
    .update(giftRegistry)
    .set({
      status: "received",
      updatedAt: new Date(),
    })
    .where(eq(giftRegistry.id, itemId));
}

// Delete gift registry item
export async function deleteGiftRegistryItem(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  await db.delete(giftRegistry).where(eq(giftRegistry.id, itemId));
}

