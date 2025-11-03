import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { filterByVisibility } from "./visibilityHelpers";
import { notifyHouseholdMembers } from "./notificationHelpers";

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
        visibilityGroupId: z.number().optional(),
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
        visibilityGroupId: input.visibilityGroupId || null,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "announcement_created",
        targetType: "announcement",
        targetId: announcementId,
        metadata: { title: input.title, pinned: input.pinned },
      });

      // Send notification to household members
      notifyHouseholdMembers(
        ctx.user.householdId,
        "new_announcement",
        {
          title: input.title,
          preview: input.body.substring(0, 150) + (input.body.length > 150 ? "..." : ""),
          isPinned: input.pinned,
          actionUrl: `${process.env.REPL_HOME || ""}/messages`,
        },
        [ctx.user.id]
      ).catch(err => console.error("Failed to send new_announcement notification:", err));

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
});

