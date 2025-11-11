import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { onboardingTours, userTourProgress } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

async function validateTourAccess(
  db: Awaited<ReturnType<typeof getDb>>,
  tourId: number,
  userRole: string
): Promise<void> {
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  }
  const tour = await db
    .select()
    .from(onboardingTours)
    .where(eq(onboardingTours.id, tourId))
    .limit(1);

  if (tour.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Tour not found",
    });
  }

  if (!tour[0].isActive) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Tour is not active",
    });
  }

  const roleAccess = tour[0].roleAccess as string[];
  if (!roleAccess.includes(userRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this tour",
    });
  }
}

export const onboardingRouter = router({
  listAvailableTours: protectedProcedure
    .input(
      z.object({
        scope: z.enum(["household", "feature", "help"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
      }

      const userRole = ctx.user.role || "supporter";

      const conditions = [
        eq(onboardingTours.isActive, true),
        sql`${onboardingTours.roleAccess} @> ${sql.raw(`'["${userRole}"]'::jsonb`)}`
      ];

      if (input?.scope) {
        conditions.push(eq(onboardingTours.scope, input.scope));
      }

      const tours = await db
        .select()
        .from(onboardingTours)
        .where(and(...conditions));

      const progressRecords = await db
        .select()
        .from(userTourProgress)
        .where(
          and(
            eq(userTourProgress.userId, ctx.user.id),
            eq(userTourProgress.householdId, ctx.user.householdId)
          )
        );

      const progressMap = new Map(
        progressRecords.map(p => [p.tourId, p])
      );

      const toursWithProgress = tours.map(tour => ({
        ...tour,
        progress: progressMap.get(tour.id) || null,
      }));

      return toursWithProgress;
    }),

  getProgress: protectedProcedure
    .input(
      z.object({
        tourId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
      }

      const userRole = ctx.user.role || "supporter";
      await validateTourAccess(db, input.tourId, userRole);

      const progress = await db
        .select()
        .from(userTourProgress)
        .where(
          and(
            eq(userTourProgress.userId, ctx.user.id),
            eq(userTourProgress.householdId, ctx.user.householdId),
            eq(userTourProgress.tourId, input.tourId)
          )
        )
        .limit(1);

      return progress[0] || null;
    }),

  updateProgress: protectedProcedure
    .input(
      z.object({
        tourId: z.number(),
        lastStep: z.number().min(0),
        status: z.enum(["not_started", "in_progress", "completed", "dismissed"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
      }

      const userRole = ctx.user.role || "supporter";
      await validateTourAccess(db, input.tourId, userRole);

      const existingProgress = await db
        .select()
        .from(userTourProgress)
        .where(
          and(
            eq(userTourProgress.userId, ctx.user.id),
            eq(userTourProgress.householdId, ctx.user.householdId),
            eq(userTourProgress.tourId, input.tourId)
          )
        )
        .limit(1);

      if (existingProgress.length > 0) {
        const updated = await db
          .update(userTourProgress)
          .set({
            lastStep: input.lastStep,
            status: input.status || "in_progress",
            updatedAt: new Date(),
          })
          .where(eq(userTourProgress.id, existingProgress[0].id))
          .returning();

        return updated[0];
      } else {
        const created = await db
          .insert(userTourProgress)
          .values({
            userId: ctx.user.id,
            householdId: ctx.user.householdId,
            tourId: input.tourId,
            lastStep: input.lastStep,
            status: input.status || "in_progress",
          })
          .returning();

        return created[0];
      }
    }),

  completeTour: protectedProcedure
    .input(
      z.object({
        tourId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
      }

      const userRole = ctx.user.role || "supporter";
      await validateTourAccess(db, input.tourId, userRole);

      const existingProgress = await db
        .select()
        .from(userTourProgress)
        .where(
          and(
            eq(userTourProgress.userId, ctx.user.id),
            eq(userTourProgress.householdId, ctx.user.householdId),
            eq(userTourProgress.tourId, input.tourId)
          )
        )
        .limit(1);

      if (existingProgress.length > 0) {
        const updated = await db
          .update(userTourProgress)
          .set({
            status: "completed",
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userTourProgress.id, existingProgress[0].id))
          .returning();

        return updated[0];
      } else {
        const created = await db
          .insert(userTourProgress)
          .values({
            userId: ctx.user.id,
            householdId: ctx.user.householdId,
            tourId: input.tourId,
            status: "completed",
            completedAt: new Date(),
          })
          .returning();

        return created[0];
      }
    }),

  dismissTour: protectedProcedure
    .input(
      z.object({
        tourId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
      }

      const userRole = ctx.user.role || "supporter";
      await validateTourAccess(db, input.tourId, userRole);

      const existingProgress = await db
        .select()
        .from(userTourProgress)
        .where(
          and(
            eq(userTourProgress.userId, ctx.user.id),
            eq(userTourProgress.householdId, ctx.user.householdId),
            eq(userTourProgress.tourId, input.tourId)
          )
        )
        .limit(1);

      if (existingProgress.length > 0) {
        const updated = await db
          .update(userTourProgress)
          .set({
            status: "dismissed",
            dismissedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userTourProgress.id, existingProgress[0].id))
          .returning();

        return updated[0];
      } else {
        const created = await db
          .insert(userTourProgress)
          .values({
            userId: ctx.user.id,
            householdId: ctx.user.householdId,
            tourId: input.tourId,
            status: "dismissed",
            dismissedAt: new Date(),
          })
          .returning();

        return created[0];
      }
    }),

  resetTour: protectedProcedure
    .input(
      z.object({
        tourId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
      }

      const userRole = ctx.user.role || "supporter";
      await validateTourAccess(db, input.tourId, userRole);

      const existingProgress = await db
        .select()
        .from(userTourProgress)
        .where(
          and(
            eq(userTourProgress.userId, ctx.user.id),
            eq(userTourProgress.householdId, ctx.user.householdId),
            eq(userTourProgress.tourId, input.tourId)
          )
        )
        .limit(1);

      if (existingProgress.length > 0) {
        const updated = await db
          .update(userTourProgress)
          .set({
            status: "not_started",
            lastStep: 0,
            completedAt: null,
            dismissedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(userTourProgress.id, existingProgress[0].id))
          .returning();

        return updated[0];
      }

      return null;
    }),
});
