import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature is only available to admins",
    });
  }
  return next({ ctx });
});

export const adminMessageRouter = router({
  // Send message to supporters
  send: adminProcedure
    .input(
      z.object({
        recipientType: z.enum(["individual", "group", "all"]),
        recipientId: z.number().optional(),
        subject: z.string().min(1),
        body: z.string().min(1),
        includePrimary: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Determine recipient user IDs
      let recipientIds: number[] = [];

      if (input.recipientType === "individual") {
        if (!input.recipientId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Recipient ID required" });
        }
        recipientIds = [input.recipientId];
      } else if (input.recipientType === "group") {
        if (!input.recipientId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Group ID required" });
        }
        const members = await db.getAdminGroupMembers(input.recipientId);
        recipientIds = members.map((m) => m.userId);
      } else {
        // All supporters
        const users = await db.getUsersByHousehold(ctx.user.householdId);
        recipientIds = users
          .filter((u) => u.status === "active" && u.role === "supporter")
          .map((u) => u.id);
      }

      // Add primary if requested
      if (input.includePrimary) {
        const users = await db.getUsersByHousehold(ctx.user.householdId);
        const primary = users.find((u) => u.role === "primary");
        if (primary) {
          recipientIds.push(primary.id);
        }
      }

      // Create admin message
      const messageId = await db.createAdminMessage({
        householdId: ctx.user.householdId,
        senderId: ctx.user.id,
        subject: input.subject,
        body: input.body,
        recipientType: input.recipientType,
        recipientGroupId: input.recipientId || null,
        includedPrimary: input.includePrimary,
      });

      // Create message recipients
      for (const recipientId of recipientIds) {
        await db.createAdminMessageRecipient({
          messageId,
          userId: recipientId,
        });
      }

      // Create audit log
      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "admin_message_sent",
        targetType: "admin_message",
        targetId: messageId,
        metadata: {
          recipientType: input.recipientType,
          recipientCount: recipientIds.length,
          includedPrimary: input.includePrimary,
        },
      });

      // TODO: Send actual notifications via email/SMS

      return { success: true, messageId, recipientCount: recipientIds.length };
    }),

  // List sent messages
  listSent: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    return await db.getAdminMessagesByHousehold(ctx.user.householdId);
  }),
});

export const adminGroupRouter = router({
  // Create custom group
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        memberIds: z.array(z.number()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Create group
      const groupId = await db.createAdminGroup({
        householdId: ctx.user.householdId,
        createdBy: ctx.user.id,
        name: input.name,
        description: input.description || null,
      });

      // Add members
      for (const memberId of input.memberIds) {
        await db.addAdminGroupMember({
          groupId,
          userId: memberId,
        });
      }

      // Create audit log
      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "admin_group_created",
        targetType: "admin_group",
        targetId: groupId,
        metadata: { memberCount: input.memberIds.length },
      });

      return { success: true, groupId };
    }),

  // List admin groups
  list: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    return await db.getAdminGroupsByHousehold(ctx.user.householdId);
  }),

  // Delete group
  delete: adminProcedure
    .input(
      z.object({
        groupId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Verify group belongs to household
      const group = await db.getAdminGroup(input.groupId);
      if (!group || group.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Group not found" });
      }

      await db.deleteAdminGroup(input.groupId);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "admin_group_deleted",
        targetType: "admin_group",
        targetId: input.groupId,
        metadata: {},
      });

      return { success: true };
    }),
});

