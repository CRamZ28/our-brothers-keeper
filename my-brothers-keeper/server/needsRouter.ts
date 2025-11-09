import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { filterByVisibility } from "./visibilityHelpers";
import { notifyVisibleUsers } from "./notificationHelpers";

export const needsRouter = router({
  // List all needs for the household (filtered by visibility)
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }

    const allNeeds = await db.getNeedsByHousehold(ctx.user.householdId);

    // Filter based on visibility scope, groups, and custom user lists
    const visibleNeeds = await filterByVisibility(
      allNeeds,
      ctx.user.id,
      ctx.user.role,
      ctx.user.accessTier,
      ctx.user.householdId
    );

    return visibleNeeds;
  }),

  // Get a single need with claims
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const need = await db.getNeed(input.id);
      if (!need) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
      }

      // Check household ownership - return NOT_FOUND to prevent enumeration
      if (need.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
      }

      // Check visibility - supporter can only see needs they're allowed to view
      const visibleNeeds = await filterByVisibility(
        [need],
        ctx.user.id,
        ctx.user.role,
        ctx.user.accessTier,
        ctx.user.householdId
      );

      if (visibleNeeds.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
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
        visibilityGroupIds: z.array(z.number()).optional(),
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
        visibilityGroupIds: input.visibilityGroupIds || null,
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

      // Send notification to household members who can see this need
      const createdNeed = await db.getNeed(needId);
      if (createdNeed) {
        const allMembers = await db.getUsersByHousehold(ctx.user.householdId);
        
        // Check visibility for each member individually
        const targetUserIds: string[] = [];
        for (const member of allMembers) {
          const visibleNeeds = await filterByVisibility(
            [createdNeed],
            member.id,
            member.role,
        member.accessTier,
        ctx.user.householdId
          );
          if (visibleNeeds.length > 0) {
            targetUserIds.push(member.id);
          }
        }
        
        if (targetUserIds.length > 0) {
          const categoryLabels: Record<string, string> = {
            meals: "Meals",
            rides: "Transportation",
            errands: "Errands",
            childcare: "Childcare",
            household: "Household Tasks",
            other: "Other Support",
          };
          
          notifyVisibleUsers(
            ctx.user.householdId,
            targetUserIds,
            "need_created",
            {
              needTitle: input.title,
              needDescription: input.details || "No additional details provided.",
              needCategory: categoryLabels[input.category] || input.category,
              actionUrl: `${process.env.REPL_HOME || ""}/needs`,
            },
            [ctx.user.id]
          ).catch((err: Error) => console.error("Failed to send need_created notification:", err));
        }
      }

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
        visibilityGroupIds: z.array(z.number()).optional(),
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

      // Check household ownership - return NOT_FOUND to prevent enumeration
      if (need.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
      }

      // Check visibility - supporter can only update needs they're allowed to view
      const visibleNeeds = await filterByVisibility(
        [need],
        ctx.user.id,
        ctx.user.role,
        ctx.user.accessTier,
        ctx.user.householdId
      );

      if (visibleNeeds.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
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

      // Check household ownership - return NOT_FOUND to prevent enumeration
      if (need.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
      }

      // Check visibility - supporter can only delete needs they're allowed to view
      const visibleNeeds = await filterByVisibility(
        [need],
        ctx.user.id,
        ctx.user.role,
        ctx.user.accessTier,
        ctx.user.householdId
      );

      if (visibleNeeds.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
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

      // Check household ownership - return NOT_FOUND to prevent enumeration
      if (need.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
      }

      // Check visibility - supporter can only claim needs they're allowed to view
      const visibleNeeds = await filterByVisibility(
        [need],
        ctx.user.id,
        ctx.user.role,
        ctx.user.accessTier,
        ctx.user.householdId
      );

      if (visibleNeeds.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
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

      // Send notification to primary/admin users
      const allMembers = await db.getUsersByHousehold(ctx.user.householdId);
      const adminUserIds = allMembers
        .filter(m => m.role === "primary" || m.role === "admin")
        .map(m => m.id);

      notifyVisibleUsers(
        ctx.user.householdId,
        adminUserIds,
        "need_claimed",
        {
          needTitle: need.title,
          claimerName: ctx.user.name,
          actionUrl: `${process.env.REPL_HOME || ""}/needs`,
        },
        [ctx.user.id]
      ).catch((err: Error) => console.error("Failed to send need_claimed notification:", err));

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

      // Check household ownership - return NOT_FOUND to prevent enumeration
      if (need.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
      }

      // Check visibility - supporter can only complete needs they're allowed to view
      const visibleNeeds = await filterByVisibility(
        [need],
        ctx.user.id,
        ctx.user.role,
        ctx.user.accessTier,
        ctx.user.householdId
      );

      if (visibleNeeds.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
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

      // Send notification to primary/admin users
      const allMembers = await db.getUsersByHousehold(ctx.user.householdId);
      const adminUserIds = allMembers
        .filter(m => m.role === "primary" || m.role === "admin")
        .map(m => m.id);

      notifyVisibleUsers(
        ctx.user.householdId,
        adminUserIds,
        "need_completed",
        {
          needTitle: need.title,
          completerName: ctx.user.name,
          actionUrl: `${process.env.REPL_HOME || ""}/needs`,
        },
        [ctx.user.id]
      ).catch((err: Error) => console.error("Failed to send need_completed notification:", err));

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

      // Get the need to check household and visibility
      const need = await db.getNeed(claim.needId);
      if (!need) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Claim not found" });
      }

      // CRITICAL: Validate household ownership BEFORE visibility check
      if (need.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Claim not found" });
      }

      // Check visibility - supporter can only complete claims for needs they're allowed to view
      const visibleNeeds = await filterByVisibility(
        [need],
        ctx.user.id,
        ctx.user.role,
        ctx.user.accessTier,
        ctx.user.householdId
      );

      if (visibleNeeds.length === 0) {
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

      const claim = await db.getNeedClaim(input.claimId);
      if (!claim) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Claim not found" });
      }

      // Get the need to check household and visibility
      const need = await db.getNeed(claim.needId);
      if (!need) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Claim not found" });
      }

      // CRITICAL: Validate household ownership BEFORE visibility check
      if (need.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Claim not found" });
      }

      // Check visibility - supporter can only release claims for needs they're allowed to view
      const visibleNeeds = await filterByVisibility(
        [need],
        ctx.user.id,
        ctx.user.role,
        ctx.user.accessTier,
        ctx.user.householdId
      );

      if (visibleNeeds.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Claim not found" });
      }

      // Update claim status
      await db.updateNeedClaim(input.claimId, { status: "released" });

      // Get the need and update its status back to open
      await db.updateNeed(claim.needId, { status: "open" });

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

