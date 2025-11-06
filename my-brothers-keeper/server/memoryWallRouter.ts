import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const memoryWallRouter = router({
  // Create memory wall entry
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["memory", "story", "encouragement", "prayer", "picture"]),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Validate input based on type
      if (input.type === "picture" && !input.imageUrl && (!input.imageUrls || input.imageUrls.length === 0)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Picture entries must have at least one image" });
      }

      if (input.type !== "picture" && !input.content) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This entry type requires content" });
      }

      const entryId = await db.createMemoryWallEntry({
        householdId: ctx.user.householdId,
        authorId: ctx.user.id,
        type: input.type,
        content: input.content || null,
        imageUrl: input.imageUrl || null,
        imageUrls: input.imageUrls || null,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "memory_wall_created",
        targetType: "memory_wall",
        targetId: entryId,
        metadata: { type: input.type },
      });

      return { success: true, entryId };
    }),

  // List memory wall entries with optional type filter
  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(["memory", "story", "encouragement", "prayer", "picture"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        return [];
      }

      return await db.getMemoryWallEntries(ctx.user.householdId, input?.type);
    }),

  // Delete memory wall entry
  delete: protectedProcedure
    .input(
      z.object({
        entryId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Get entry to verify ownership
      const entry = await db.getMemoryWallEntry(input.entryId);
      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
      }

      if (entry.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Entry belongs to different household" });
      }

      // Only author, admin, or primary can delete
      if (entry.authorId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "primary") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the author, admin, or primary can delete" });
      }

      await db.deleteMemoryWallEntry(input.entryId);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "memory_wall_deleted",
        targetType: "memory_wall",
        targetId: input.entryId,
      });

      return { success: true };
    }),
});
