import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const needsRouter = router({
  // List all needs for the household (filtered by visibility)
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }

    const allNeeds = await db.getNeedsByHousehold(ctx.user.householdId);

    // TODO: Filter by visibility scope based on user's role and groups
    // For now, return all needs
    return allNeeds;
  }),

  // Get a single need with claims
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const need = await db.getNeed(input.id);
      if (!need) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
      }

      if (need.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const claims = await db.getClaimsByNeed(input.id);

      return { need, claims };
    }),

  // Create a new need
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        details: z.string().optional(),
        category: z.enum(["meals", "rides", "errands", "childcare", "household", "other"]),
        priority: z.enum(["low", "normal", "urgent"]).default("normal"),
        dueAt: z.date().optional(),
        visibilityScope: z
          .enum(["private", "all_supporters", "group", "role", "custom"])
          .default("all_supporters"),
        visibilityGroupId: z.number().optional(),
        customUserIds: z.array(z.string()).optional(),
        capacity: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Check permission - Primary, Admin, or delegated Admin can create needs
      const canCreate = ctx.user.role === "primary" || ctx.user.role === "admin";
      if (!canCreate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary or Admin can create needs",
        });
      }

      const needId = await db.createNeed({
        householdId: ctx.user.householdId,
        title: input.title,
        details: input.details || null,
        category: input.category,
        priority: input.priority,
        dueAt: input.dueAt || null,
        createdBy: ctx.user.id,
        visibilityScope: input.visibilityScope,
        visibilityGroupId: input.visibilityGroupId || null,
        customUserIds: input.customUserIds || null,
        status: "open",
        capacity: input.capacity || null,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "need_created",
        targetType: "need",
        targetId: needId,
        metadata: { title: input.title, category: input.category },
      });

      return { needId };
    }),

  // Update a need
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        details: z.string().optional(),
        category: z.enum(["meals", "rides", "errands", "childcare", "household", "other"]).optional(),
        priority: z.enum(["low", "normal", "urgent"]).optional(),
        dueAt: z.date().optional(),
        status: z.enum(["open", "claimed", "completed", "cancelled"]).optional(),
        capacity: z.number().optional(),
        visibilityScope: z.enum(["private", "all_supporters", "group", "role", "custom"]).optional(),
        visibilityGroupId: z.number().optional(),
        customUserIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      const need = await db.getNeed(input.id);
      if (!need) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
      }

      if (need.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Check permission
      const canUpdate =
        ctx.user.role === "primary" || ctx.user.role === "admin" || need.createdBy === ctx.user.id;
      if (!canUpdate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary, Admin, or creator can update needs",
        });
      }

      const { id, ...updateData } = input;
      await db.updateNeed(id, updateData);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "need_updated",
        targetType: "need",
        targetId: id,
        metadata: updateData,
      });

      return { success: true };
    }),

  // Delete a need
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      const need = await db.getNeed(input.id);
      if (!need) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
      }

      if (need.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Check permission
      const canDelete =
        ctx.user.role === "primary" || ctx.user.role === "admin" || need.createdBy === ctx.user.id;
      if (!canDelete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary, Admin, or creator can delete needs",
        });
      }

      await db.deleteNeed(input.id);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "need_deleted",
        targetType: "need",
        targetId: input.id,
        metadata: { title: need.title },
      });

      return { success: true };
    }),

  // Claim a need
  claim: protectedProcedure
    .input(
      z.object({
        needId: z.number(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      const need = await db.getNeed(input.needId);
      if (!need) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
      }

      if (need.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      if (need.status !== "open") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Need is not available to claim" });
      }

      // Create claim
      const claimId = await db.createNeedClaim({
        needId: input.needId,
        userId: ctx.user.id,
        note: input.note || null,
        status: "claimed",
      });

      // Update need status
      await db.updateNeed(input.needId, { status: "claimed" });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "need_claimed",
        targetType: "need",
        targetId: input.needId,
        metadata: { claimId, note: input.note },
      });

      return { claimId };
    }),

  // Mark a need as completed (simplified endpoint)
  complete: protectedProcedure
    .input(
      z.object({
        needId: z.number(),
        completionNote: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      const need = await db.getNeed(input.needId);
      if (!need) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
      }

      if (need.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Check permission - claimer, Primary, or Admin can mark as completed
      const claims = await db.getClaimsByNeed(input.needId);
      const userClaim = claims.find(c => c.userId === ctx.user.id);
      const canComplete =
        ctx.user.role === "primary" ||
        ctx.user.role === "admin" ||
        userClaim !== undefined;

      if (!canComplete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the claimer, Primary, or Admin can mark as completed",
        });
      }

      // Update need status to completed
      await db.updateNeed(input.needId, { 
        status: "completed",
        completedAt: new Date(),
      });

      // Update all claims for this need to completed
      for (const claim of claims) {
        await db.updateNeedClaim(claim.id, { 
          status: "completed",
          completedAt: new Date(),
        });
      }

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "need_completed",
        targetType: "need",
        targetId: input.needId,
        metadata: { completionNote: input.completionNote },
      });

      return { success: true };
    }),

  // Mark claim as completed (legacy endpoint)
  completeClaim: protectedProcedure
    .input(z.object({ claimId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      const claim = await db.getNeedClaim(input.claimId);
      if (!claim) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Claim not found" });
      }

      // Update claim status
      await db.updateNeedClaim(input.claimId, { 
        status: "completed",
        completedAt: new Date(),
      });

      // Get the need and update its status to completed
      await db.updateNeed(claim.needId, { 
        status: "completed",
        completedAt: new Date(),
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "need_completed",
        targetType: "need",
        targetId: claim.needId,
        metadata: { claimId: input.claimId },
      });

      return { success: true };
    }),

  // Release a claim (unclaim)
  releaseClaim: protectedProcedure
    .input(z.object({ claimId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Update claim status
      await db.updateNeedClaim(input.claimId, { status: "released" });

      // TODO: Get the need and update its status back to open

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "need_claim_released",
        targetType: "need_claim",
        targetId: input.claimId,
        metadata: {},
      });

      return { success: true };
    }),
});

