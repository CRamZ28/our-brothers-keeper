import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { reminders, needs, events, households } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const reminderRouter = router({
  // Create a personal reminder (standalone, not tied to need/event)
  createPersonal: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        triggerAt: z.string(), // ISO date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
      }

      const triggerDate = new Date(input.triggerAt);

      // Check if trigger time is in the past
      if (triggerDate < new Date()) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Reminder time must be in the future" 
        });
      }

      // Create the personal reminder
      const reminder = await db
        .insert(reminders)
        .values({
          userId: ctx.user.id,
          householdId: ctx.user.householdId,
          targetType: "personal",
          targetId: null,
          reminderOffsetMinutes: null,
          triggerAt: triggerDate,
          title: input.title,
          description: input.description || null,
          status: "queued",
        })
        .returning();

      return reminder[0];
    }),

  // Create a new reminder
  create: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["need", "event"]),
        targetId: z.number(),
        reminderOffsetMinutes: z.number().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
      }

      // Get household timezone for calculations
      const household = await db
        .select()
        .from(households)
        .where(eq(households.id, ctx.user.householdId))
        .limit(1);

      if (household.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Household not found" });
      }

      // Get the target (need or event) to calculate trigger time
      let targetDate: Date | null = null;

      if (input.targetType === "need") {
        const need = await db
          .select()
          .from(needs)
          .where(eq(needs.id, input.targetId))
          .limit(1);

        if (need.length === 0 || need[0].householdId !== ctx.user.householdId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Need not found" });
        }

        targetDate = need[0].dueAt;
      } else {
        const event = await db
          .select()
          .from(events)
          .where(eq(events.id, input.targetId))
          .limit(1);

        if (event.length === 0 || event[0].householdId !== ctx.user.householdId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        targetDate = event[0].startAt;
      }

      if (!targetDate) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: `Cannot set reminder: ${input.targetType} has no date/time` 
        });
      }

      // Calculate trigger time (target date minus offset)
      const triggerAt = new Date(targetDate.getTime() - input.reminderOffsetMinutes * 60 * 1000);

      // Check if trigger time is in the past
      if (triggerAt < new Date()) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Cannot set reminder: trigger time would be in the past" 
        });
      }

      // Create the reminder
      const reminder = await db
        .insert(reminders)
        .values({
          userId: ctx.user.id,
          householdId: ctx.user.householdId,
          targetType: input.targetType,
          targetId: input.targetId,
          reminderOffsetMinutes: input.reminderOffsetMinutes,
          triggerAt,
          status: "queued",
        })
        .returning();

      return reminder[0];
    }),

  // List all reminders for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    if (!ctx.user.householdId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
    }

    const userReminders = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.userId, ctx.user.id),
          eq(reminders.householdId, ctx.user.householdId)
        )
      )
      .orderBy(reminders.triggerAt);

    return userReminders;
  }),

  // Get reminders for a specific target (need or event)
  listByTarget: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["need", "event"]),
        targetId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
      }

      const targetReminders = await db
        .select()
        .from(reminders)
        .where(
          and(
            eq(reminders.userId, ctx.user.id),
            eq(reminders.householdId, ctx.user.householdId),
            eq(reminders.targetType, input.targetType),
            eq(reminders.targetId, input.targetId)
          )
        );

      return targetReminders;
    }),

  // Delete a reminder
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not in household" });
      }

      // Verify ownership before deleting
      const reminder = await db
        .select()
        .from(reminders)
        .where(eq(reminders.id, input.id))
        .limit(1);

      if (reminder.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reminder not found" });
      }

      if (reminder[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own reminders" });
      }

      // Mark as cancelled instead of deleting (for audit trail)
      await db
        .update(reminders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(reminders.id, input.id));

      return { success: true };
    }),
});
