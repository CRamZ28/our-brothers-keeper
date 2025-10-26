import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const updatesRouter = router({
  // Create update
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["general", "gratitude", "memory", "milestone"]),
        title: z.string().min(1),
        body: z.string().min(1),
        photoUrls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Only Primary or Admin can post updates
      if (ctx.user.role !== "primary" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary or Admin can post updates",
        });
      }

      const updateId = await db.createUpdate({
        householdId: ctx.user.householdId,
        authorId: ctx.user.id,
        type: input.type,
        title: input.title,
        body: input.body,
        photoUrls: input.photoUrls || null,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "update_posted",
        targetType: "update",
        targetId: updateId,
        metadata: { type: input.type, hasPhotos: (input.photoUrls?.length || 0) > 0 },
      });

      return { success: true, updateId };
    }),

  // List updates
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }

    return await db.getUpdatesByHousehold(ctx.user.householdId);
  }),

  // Delete update
  delete: protectedProcedure
    .input(
      z.object({
        updateId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Get update to verify ownership
      const update = await db.getUpdate(input.updateId);
      if (!update) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Update not found" });
      }

      if (update.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Update belongs to different household" });
      }

      // Only author or admin can delete
      if (update.authorId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the author or admin can delete" });
      }

      await db.deleteUpdate(input.updateId);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "update_deleted",
        targetType: "update",
        targetId: input.updateId,
        metadata: {},
      });

      return { success: true };
    }),
});

