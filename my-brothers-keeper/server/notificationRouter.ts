import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { notificationPreferences } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const notificationRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    if (!ctx.user.householdId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
    }

    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, ctx.user.id),
          eq(notificationPreferences.householdId, ctx.user.householdId)
        )
      )
      .limit(1);

    if (prefs.length === 0) {
      const defaultPrefs = await db
        .insert(notificationPreferences)
        .values({
          userId: ctx.user.id,
          householdId: ctx.user.householdId,
        })
        .returning();

      return defaultPrefs[0];
    }

    return prefs[0];
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailEnabled: z.boolean().optional(),
        emailNeedCreated: z.boolean().optional(),
        emailNeedClaimed: z.boolean().optional(),
        emailNeedCompleted: z.boolean().optional(),
        emailEventCreated: z.boolean().optional(),
        emailEventRsvp: z.boolean().optional(),
        emailMealTrainSignup: z.boolean().optional(),
        emailMealTrainCancelled: z.boolean().optional(),
        emailNewMessage: z.boolean().optional(),
        emailNewAnnouncement: z.boolean().optional(),
        emailNewUpdate: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
      }

      const existing = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.userId, ctx.user.id),
            eq(notificationPreferences.householdId, ctx.user.householdId)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        const created = await db
          .insert(notificationPreferences)
          .values({
            userId: ctx.user.id,
            householdId: ctx.user.householdId,
            ...input,
          })
          .returning();

        return created[0];
      }

      const updated = await db
        .update(notificationPreferences)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notificationPreferences.userId, ctx.user.id),
            eq(notificationPreferences.householdId, ctx.user.householdId)
          )
        )
        .returning();

      return updated[0];
    }),
});
