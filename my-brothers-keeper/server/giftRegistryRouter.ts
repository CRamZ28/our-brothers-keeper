import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const giftRegistryRouter = router({
  // Create gift registry item
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        url: z.string().optional(),
        imageUrl: z.string().optional(),
        price: z.string().optional(),
        priority: z.enum(["low", "normal", "urgent"]).default("normal"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Only Primary or Admin can add items to gift registry
      if (ctx.user.role !== "primary" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary or Admin can add items to gift registry",
        });
      }

      const itemId = await db.createGiftRegistryItem({
        householdId: ctx.user.householdId,
        name: input.name,
        description: input.description || null,
        url: input.url || null,
        imageUrl: input.imageUrl || null,
        price: input.price || null,
        priority: input.priority,
        status: "needed",
        notes: input.notes || null,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "gift_registry_created",
        targetType: "gift_registry",
        targetId: itemId,
        metadata: { name: input.name, priority: input.priority },
      });

      return { success: true, itemId };
    }),

  // List gift registry items
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }

    return await db.getGiftRegistryItems(ctx.user.householdId);
  }),

  // Update gift registry item
  update: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        url: z.string().optional(),
        imageUrl: z.string().optional(),
        price: z.string().optional(),
        priority: z.enum(["low", "normal", "urgent"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Get item to verify ownership
      const item = await db.getGiftRegistryItem(input.itemId);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      if (item.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Item belongs to different household" });
      }

      // Only Primary or Admin can update
      if (ctx.user.role !== "primary" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Primary or Admin can update items" });
      }

      await db.updateGiftRegistryItem(input.itemId, {
        name: input.name,
        description: input.description,
        url: input.url,
        imageUrl: input.imageUrl,
        price: input.price,
        priority: input.priority,
        notes: input.notes,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "gift_registry_updated",
        targetType: "gift_registry",
        targetId: input.itemId,
      });

      return { success: true };
    }),

  // Mark as purchased
  markPurchased: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Get item to verify ownership
      const item = await db.getGiftRegistryItem(input.itemId);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      if (item.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Item belongs to different household" });
      }

      await db.markGiftPurchased(input.itemId, ctx.user.id);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "gift_purchased",
        targetType: "gift_registry",
        targetId: input.itemId,
      });

      return { success: true };
    }),

  // Mark as received
  markReceived: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Get item to verify ownership
      const item = await db.getGiftRegistryItem(input.itemId);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      if (item.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Item belongs to different household" });
      }

      // Only Primary or Admin can mark as received
      if (ctx.user.role !== "primary" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Primary or Admin can mark items as received" });
      }

      await db.markGiftReceived(input.itemId);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "gift_received",
        targetType: "gift_registry",
        targetId: input.itemId,
      });

      return { success: true };
    }),

  // Delete gift registry item
  delete: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Get item to verify ownership
      const item = await db.getGiftRegistryItem(input.itemId);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }

      if (item.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Item belongs to different household" });
      }

      // Only Primary or Admin can delete
      if (ctx.user.role !== "primary" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Primary or Admin can delete items" });
      }

      await db.deleteGiftRegistryItem(input.itemId);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "gift_registry_deleted",
        targetType: "gift_registry",
        targetId: input.itemId,
      });

      return { success: true };
    }),
});
