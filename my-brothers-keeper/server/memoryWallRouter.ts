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

  // Update memory wall entry
  update: protectedProcedure
    .input(
      z.object({
        entryId: z.number(),
        type: z.enum(["memory", "story", "encouragement", "prayer", "picture"]).optional(),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
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

      // Only author, admin, or primary can edit
      if (entry.authorId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "primary") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the author, admin, or primary can edit" });
      }

      // Validate input based on type (if type is being changed)
      const newType = input.type || entry.type;
      const finalImageUrl = input.imageUrl !== undefined ? input.imageUrl : entry.imageUrl;
      const finalImageUrls = input.imageUrls !== undefined ? input.imageUrls : entry.imageUrls;
      const finalContent = input.content !== undefined ? input.content : entry.content;

      // Picture entries must have at least one image (check final state)
      if (newType === "picture" && !finalImageUrl && (!finalImageUrls || finalImageUrls.length === 0)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Picture entries must have at least one image" });
      }

      // Non-picture entries must have non-empty content (check final state)
      if (newType !== "picture" && (!finalContent || finalContent.trim() === "")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This entry type requires content" });
      }

      await db.updateMemoryWallEntry(input.entryId, {
        type: input.type,
        content: input.content,
        imageUrl: input.imageUrl,
        imageUrls: input.imageUrls,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "memory_wall_updated",
        targetType: "memory_wall",
        targetId: input.entryId,
        metadata: { type: newType },
      });

      return { success: true };
    }),

  // Get user-specific positions for memory wall cards
  getPositions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }

    return await db.getMemoryWallPositions(ctx.user.id, ctx.user.householdId);
  }),

  // Save/update position for a memory wall card
  savePosition: protectedProcedure
    .input(
      z.object({
        memoryId: z.number(),
        x: z.number(),
        y: z.number(),
        rotation: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        console.log("[MemoryWall] Saving position:", {
          userId: ctx.user.id,
          householdId: ctx.user.householdId,
          memoryId: input.memoryId,
          x: input.x,
          y: input.y,
          rotation: input.rotation || 0,
        });

        await db.saveMemoryWallPosition({
          userId: ctx.user.id,
          householdId: ctx.user.householdId,
          memoryId: input.memoryId,
          x: input.x,
          y: input.y,
          rotation: input.rotation || 0,
        });

        console.log("[MemoryWall] Position saved successfully");
        return { success: true };
      } catch (error) {
        console.error("[MemoryWall] Error saving position:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: `Failed to save position: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      }
    }),
});
