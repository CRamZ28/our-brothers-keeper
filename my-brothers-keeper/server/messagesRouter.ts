import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { filterByVisibility } from "./visibilityHelpers";
import { notifyVisibleUsers } from "./notificationHelpers";

export const messagesRouter = router({
  // List announcements for the household
  listAnnouncements: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }

    const announcements = await db.getAnnouncementsByHousehold(ctx.user.householdId);

    // Filter based on visibility scope, groups, and custom user lists
    const visibleAnnouncements = await filterByVisibility(
      announcements,
      ctx.user.id,
      ctx.user.role,
      ctx.user.householdId
    );

    return visibleAnnouncements;
  }),

  // Create an announcement
  createAnnouncement: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        pinned: z.boolean().default(false),
        visibilityScope: z
          .enum(["private", "all_supporters", "group", "role"])
          .default("all_supporters"),
        visibilityGroupIds: z.array(z.number()).optional(),
        mediaUrls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Check permission - Primary or Admin can create announcements
      const canCreate = ctx.user.role === "primary" || ctx.user.role === "admin";
      if (!canCreate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary or Admin can create announcements",
        });
      }

      const announcementId = await db.createAnnouncement({
        householdId: ctx.user.householdId,
        title: input.title,
        body: input.body,
        pinned: input.pinned,
        createdBy: ctx.user.id,
        visibilityScope: input.visibilityScope,
        visibilityGroupIds: input.visibilityGroupIds || null,
        mediaUrls: input.mediaUrls || null,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "announcement_created",
        targetType: "announcement",
        targetId: announcementId,
        metadata: { title: input.title, pinned: input.pinned },
      });

      // Send notification to household members who can see this announcement
      const allMembers = await db.getUsersByHousehold(ctx.user.householdId);
      
      // Construct announcement object for visibility checking
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
        createdAt: new Date(),
      };
      
      // Check visibility for each member individually
      const targetUserIds: string[] = [];
      for (const member of allMembers) {
        const visibleAnnouncements = await filterByVisibility(
          [announcement],
          member.id,
          member.role,
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
            actionUrl: `${process.env.REPL_HOME || ""}/messages`,
          },
          [ctx.user.id]
        ).catch((err: Error) => console.error("Failed to send new_announcement notification:", err));
      }

      return { announcementId };
    }),

  // Update an announcement
  updateAnnouncement: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        body: z.string().min(1).optional(),
        pinned: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Check permission - Primary or Admin can update announcements
      const canUpdate = ctx.user.role === "primary" || ctx.user.role === "admin";
      if (!canUpdate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary or Admin can update announcements",
        });
      }

      const { id, ...updateData } = input;
      await db.updateAnnouncement(id, updateData);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "announcement_updated",
        targetType: "announcement",
        targetId: id,
        metadata: updateData,
      });

      return { success: true };
    }),

  // Delete an announcement
  deleteAnnouncement: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Check permission - Primary or Admin can delete announcements
      const canDelete = ctx.user.role === "primary" || ctx.user.role === "admin";
      if (!canDelete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary or Admin can delete announcements",
        });
      }

      await db.deleteAnnouncement(input.id);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "announcement_deleted",
        targetType: "announcement",
        targetId: input.id,
        metadata: {},
      });

      return { success: true };
    }),

  // Send a question to admins/primary
  sendQuestion: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1),
        message: z.string().min(1),
        context: z.enum(["need", "event", "meal_train", "gift_registry", "general"]).optional(),
        contextId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Get all admins and primary users
      const allMembers = await db.getUsersByHousehold(ctx.user.householdId);
      const adminsAndPrimary = allMembers.filter(
        (member) => member.role === "admin" || member.role === "primary"
      );

      if (adminsAndPrimary.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No admins or primary users found",
        });
      }

      // Create announcement that's only visible to specific users (admins/primary)
      const customUserIds = adminsAndPrimary.map((user) => user.id);
      
      // Build the title with context information
      let title = input.subject;
      if (input.context && input.contextId) {
        title = `Question about ${input.context} #${input.contextId}: ${input.subject}`;
      }

      const announcementId = await db.createAnnouncement({
        householdId: ctx.user.householdId,
        title,
        body: `From: ${ctx.user.firstName || "Unknown"} ${ctx.user.lastName || ""}\n\n${input.message}`,
        pinned: false,
        createdBy: ctx.user.id,
        visibilityScope: "custom",
        visibilityGroupIds: null,
        customUserIds,
        mediaUrls: null,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "question_sent",
        targetType: "announcement",
        targetId: announcementId,
        metadata: { context: input.context, contextId: input.contextId },
      });

      // Send notification to admins and primary
      notifyVisibleUsers(
        ctx.user.householdId,
        customUserIds,
        "new_message",
        {
          announcementBody: input.message.substring(0, 150) + (input.message.length > 150 ? "..." : ""),
          actionUrl: `${process.env.REPL_HOME || ""}/messages`,
        },
        [ctx.user.id]
      ).catch((err: Error) => console.error("Failed to send question notification:", err));

      return { success: true, announcementId };
    }),

  // Send a direct message to specific users (admin/primary only)
  sendDirectMessage: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        recipientUserIds: z.array(z.string()).min(1),
        mediaUrls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Only admin or primary can send direct messages
      if (ctx.user.role !== "admin" && ctx.user.role !== "primary") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Admin or Primary can send direct messages",
        });
      }

      // Verify all recipients are in the same household
      const allMembers = await db.getUsersByHousehold(ctx.user.householdId);
      const memberIds = allMembers.map((m) => m.id);
      
      for (const recipientId of input.recipientUserIds) {
        if (!memberIds.includes(recipientId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Recipient ${recipientId} is not in your household`,
          });
        }
      }

      // Create announcement with custom visibility
      const announcementId = await db.createAnnouncement({
        householdId: ctx.user.householdId,
        title: input.title,
        body: input.body,
        pinned: false,
        createdBy: ctx.user.id,
        visibilityScope: "custom",
        visibilityGroupIds: null,
        customUserIds: input.recipientUserIds,
        mediaUrls: input.mediaUrls || null,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "direct_message_sent",
        targetType: "announcement",
        targetId: announcementId,
        metadata: { recipientCount: input.recipientUserIds.length },
      });

      // Send notification to recipients
      notifyVisibleUsers(
        ctx.user.householdId,
        input.recipientUserIds,
        "new_message",
        {
          announcementBody: input.body.substring(0, 150) + (input.body.length > 150 ? "..." : ""),
          actionUrl: `${process.env.REPL_HOME || ""}/messages`,
        },
        [ctx.user.id]
      ).catch((err: Error) => console.error("Failed to send direct message notification:", err));

      return { success: true, announcementId };
    }),
});

