import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { inviteRouter } from "./inviteRouter";
import { adminMessageRouter, adminGroupRouter } from "./adminRouter";
import { updatesRouter } from "./updatesRouter";
import { needsRouter } from "./needsRouter";
import { eventsRouter } from "./eventsRouter";
import { messagesRouter } from "./messagesRouter";
import { mealTrainRouter } from "./mealTrainRouter";
import { notificationRouter } from "./notificationRouter";
import { memoryWallRouter } from "./memoryWallRouter";
import { giftRegistryRouter } from "./giftRegistryRouter";

// Helper to check if user is Primary or Admin for a household
async function checkHouseholdAccess(
  userId: string,
  householdId: number,
  requireRole?: "primary" | "admin"
) {
  const user = await db.getUserById(userId);
  if (!user || user.householdId !== householdId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to this household" });
  }

  if (requireRole === "primary" && user.role !== "primary") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Primary role required" });
  }

  if (requireRole === "admin" && user.role !== "admin" && user.role !== "primary") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin or Primary role required" });
  }

  return user;
}

export const appRouter = router({
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

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  household: router({
    // Get current user's household
    getMy: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return null;
      }
      return await db.getHousehold(ctx.user.householdId);
    }),

    // Create a new household (for Primary user or Admin setting up on behalf)
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          timezone: z.string().default("America/Chicago"),
          delegateAdminApprovals: z.boolean().default(false),
          setupRole: z.enum(["primary", "admin"]).default("primary"),
          primaryName: z.string().optional(),
          primaryEmail: z.string().email().optional(),
          additionalAdmins: z
            .array(
              z.object({
                id: z.string(),
                name: z.string(),
                email: z.string().email(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validate admin setup has primary details
        if (input.setupRole === "admin" && (!input.primaryName || !input.primaryEmail)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Primary name and email required for admin setup",
          });
        }

        // Create household with current user as temporary primary
        // (will be updated if this is admin setup)
        const householdId = await db.createHousehold({
          name: input.name,
          primaryUserId: ctx.user.id,
          timezone: input.timezone,
          delegateAdminApprovals: input.delegateAdminApprovals,
          quietMode: false,
        });

        if (input.setupRole === "primary") {
          // User is setting up for themselves - make them Primary
          await db.upsertUser({
            id: ctx.user.id,
            role: "primary",
            householdId,
            status: "active",
          });
        } else {
          // Admin is setting up for someone else - make current user Admin
          await db.upsertUser({
            id: ctx.user.id,
            role: "admin",
            householdId,
            status: "active",
          });

          // TODO: Create invite for the actual primary person
          // For now, we'll just log this - the invite system will handle it
          console.log(
            `[Household] Admin setup: Need to invite primary ${input.primaryName} (${input.primaryEmail})`
          );
        }

        // Handle additional admin invites
        if (input.additionalAdmins && input.additionalAdmins.length > 0) {
          console.log(
            `[Household] Need to invite ${input.additionalAdmins.length} additional admins:`,
            input.additionalAdmins.map((a) => a.email).join(", ")
          );
          // TODO: Create invites for additional admins
          // This will be handled by the invite system
        }

        // Create default groups
        const innerCircleId = await db.createGroup({
          householdId,
          name: "Inner Circle",
          description: "Closest friends and family",
        });

        const immediateFamilyId = await db.createGroup({
          householdId,
          name: "Immediate Family",
          description: "Direct family members",
        });

        await db.createGroup({
          householdId,
          name: "Church/Community",
          description: "Church members and community friends",
        });

        // Add creator to Inner Circle and Immediate Family
        await db.addUserToGroup(innerCircleId, ctx.user.id);
        await db.addUserToGroup(immediateFamilyId, ctx.user.id);

        // Create audit log
        await db.createAuditLog({
          householdId,
          actorUserId: ctx.user.id,
          action: "household_created",
          targetType: "household",
          targetId: householdId,
          metadata: {
            name: input.name,
            setupRole: input.setupRole,
            primaryEmail: input.primaryEmail,
          },
        });

        return {
          householdId,
          needsPrimaryInvite: input.setupRole === "admin",
          primaryEmail: input.primaryEmail,
          additionalAdminsCount: input.additionalAdmins?.length || 0,
        };
      }),

    // Update household settings
    update: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          quietMode: z.boolean().optional(),
          timezone: z.string().optional(),
          delegateAdminApprovals: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        const canUpdate = ctx.user.role === "primary" || ctx.user.role === "admin";
        if (!canUpdate) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only Primary or Admin can update household settings",
          });
        }

        await db.updateHousehold(ctx.user.householdId, input);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "household_updated",
          targetType: "household",
          targetId: ctx.user.householdId,
          metadata: input,
        });

        return { success: true };
      }),

    // Get notification preferences for current user
    getNotificationPrefs: protectedProcedure.query(async ({ ctx }) => {
      return await db.getNotificationPrefs(ctx.user.id);
    }),

    // Update notification preferences
    updateNotificationPrefs: protectedProcedure
      .input(
        z.object({
          channelEmail: z.boolean().optional(),
          channelSms: z.boolean().optional(),
          channelPush: z.boolean().optional(),
          digestFrequency: z.enum(["immediate", "daily", "weekly"]).optional(),
          urgentNeedsAlerts: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertNotificationPrefs(ctx.user.id, input);
        return { success: true };
      }),

    // Get recent activity from audit logs
    getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await db.getRecentActivity(ctx.user.householdId, 20);
    }),
  }),

  user: router({
    // Get all users in current household
    listInHousehold: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await db.getUsersByHousehold(ctx.user.householdId);
    }),

    // Update user status (approve/block)
    updateStatus: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
          status: z.enum(["active", "pending", "blocked"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        // Check if user has permission (Primary or Admin with delegation)
        const household = await db.getHousehold(ctx.user.householdId);
        if (!household) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Household not found" });
        }

        const canApprove =
          ctx.user.role === "primary" ||
          (ctx.user.role === "admin" && household.delegateAdminApprovals);

        if (!canApprove) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only Primary or delegated Admin can update user status",
          });
        }

        await db.updateUserStatus(input.userId, input.status);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "user_status_updated",
          targetType: "user",
          targetId: 0, // Placeholder since user IDs are strings
          metadata: { userId: input.userId, status: input.status },
        });

        return { success: true };
      }),
  }),

  group: router({
    // List all groups in household
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await db.getGroupsByHousehold(ctx.user.householdId);
    }),

    // Get user's groups
    getMy: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await db.getUserGroups(ctx.user.id, ctx.user.householdId);
    }),

    // Create a new group
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        const groupId = await db.createGroup({
          householdId: ctx.user.householdId,
          name: input.name,
          description: input.description,
        });

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "group_created",
          targetType: "group",
          targetId: groupId,
          metadata: { name: input.name },
        });

        return { groupId };
      }),

    // Add user to group
    addMember: protectedProcedure
      .input(
        z.object({
          groupId: z.number(),
          userId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        await db.addUserToGroup(input.groupId, input.userId);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "group_member_added",
          targetType: "group",
          targetId: input.groupId,
          metadata: { userId: input.userId },
        });

        return { success: true };
      }),

    // Remove user from group
    removeMember: protectedProcedure
      .input(
        z.object({
          groupId: z.number(),
          userId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        await db.removeUserFromGroup(input.groupId, input.userId);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "group_member_removed",
          targetType: "group",
          targetId: input.groupId,
          metadata: { userId: input.userId },
        });

        return { success: true };
      }),

    // Update group details
    update: protectedProcedure
      .input(
        z.object({
          groupId: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        await db.updateGroup(input.groupId, {
          name: input.name,
          description: input.description,
        });

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "group_updated",
          targetType: "group",
          targetId: input.groupId,
          metadata: { name: input.name, description: input.description },
        });

        return { success: true };
      }),

    // Delete group
    delete: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        await db.deleteGroup(input.groupId);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "group_deleted",
          targetType: "group",
          targetId: input.groupId,
          metadata: {},
        });

        return { success: true };
      }),

    // Get members of a group
    getMembers: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          return [];
        }

        return await db.getGroupMembers(input.groupId);
      }),
  }),
});

export type AppRouter = typeof appRouter;

