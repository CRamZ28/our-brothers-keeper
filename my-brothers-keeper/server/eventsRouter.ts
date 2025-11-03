import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { filterByVisibility } from "./visibilityHelpers";
import { notifyHouseholdMembers } from "./notificationHelpers";

export const eventsRouter = router({
  // List all events for the household (filtered by visibility)
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }

    const allEvents = await db.getEventsByHousehold(ctx.user.householdId);

    // Filter based on visibility scope, groups, and custom user lists
    const visibleEvents = await filterByVisibility(
      allEvents,
      ctx.user.id,
      ctx.user.role,
      ctx.user.householdId
    );

    return visibleEvents;
  }),

  // Get a single event with RSVPs
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const event = await db.getEvent(input.id);
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check household ownership - return NOT_FOUND to prevent enumeration
      if (event.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check visibility - supporter can only see events they're allowed to view
      const visibleEvents = await filterByVisibility(
        [event],
        ctx.user.id,
        ctx.user.role,
        ctx.user.householdId
      );

      if (visibleEvents.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      const rsvps = await db.getRsvpsByEvent(input.id);

      return { event, rsvps };
    }),

  // Create a new event
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        location: z.string().optional(),
        startAt: z.date(),
        endAt: z.date().optional(),
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

      // Check permission - Primary, Admin, or delegated Admin can create events
      const canCreate = ctx.user.role === "primary" || ctx.user.role === "admin";
      if (!canCreate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary or Admin can create events",
        });
      }

      const eventId = await db.createEvent({
        householdId: ctx.user.householdId,
        title: input.title,
        description: input.description || null,
        location: input.location || null,
        startAt: input.startAt,
        endAt: input.endAt || null,
        createdBy: ctx.user.id,
        visibilityScope: input.visibilityScope,
        visibilityGroupId: input.visibilityGroupId || null,
        customUserIds: input.customUserIds || null,
        capacity: input.capacity || null,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "event_created",
        targetType: "event",
        targetId: eventId,
        metadata: { title: input.title, startAt: input.startAt.toISOString() },
      });

      // Send notification to household members
      notifyHouseholdMembers(
        ctx.user.householdId,
        "event_created",
        {
          title: input.title,
          description: input.description || "No description provided.",
          location: input.location || "Location to be determined.",
          eventDate: input.startAt.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          eventTime: input.startAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          actionUrl: `${process.env.REPL_HOME || ""}/calendar`,
        },
        [ctx.user.id]
      ).catch(err => console.error("Failed to send event_created notification:", err));

      return { eventId };
    }),

  // Update an event
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        startAt: z.date().optional(),
        endAt: z.date().optional(),
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

      const event = await db.getEvent(input.id);
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check household ownership - return NOT_FOUND to prevent enumeration
      if (event.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check visibility - supporter can only update events they're allowed to view
      const visibleEvents = await filterByVisibility(
        [event],
        ctx.user.id,
        ctx.user.role,
        ctx.user.householdId
      );

      if (visibleEvents.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check permission
      const canUpdate =
        ctx.user.role === "primary" || ctx.user.role === "admin" || event.createdBy === ctx.user.id;
      if (!canUpdate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary, Admin, or creator can update events",
        });
      }

      const { id, ...updateData } = input;
      await db.updateEvent(id, updateData);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "event_updated",
        targetType: "event",
        targetId: id,
        metadata: updateData,
      });

      return { success: true };
    }),

  // Delete an event
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      const event = await db.getEvent(input.id);
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check household ownership - return NOT_FOUND to prevent enumeration
      if (event.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check visibility - supporter can only delete events they're allowed to view
      const visibleEvents = await filterByVisibility(
        [event],
        ctx.user.id,
        ctx.user.role,
        ctx.user.householdId
      );

      if (visibleEvents.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check permission
      const canDelete =
        ctx.user.role === "primary" || ctx.user.role === "admin" || event.createdBy === ctx.user.id;
      if (!canDelete) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary, Admin, or creator can delete events",
        });
      }

      await db.deleteEvent(input.id);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "event_deleted",
        targetType: "event",
        targetId: input.id,
        metadata: { title: event.title },
      });

      return { success: true };
    }),

  // RSVP to an event
  rsvp: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        status: z.enum(["going", "declined", "maybe"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      const event = await db.getEvent(input.eventId);
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check household ownership - return NOT_FOUND to prevent enumeration
      if (event.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check visibility - supporter can only RSVP to events they're allowed to view
      const visibleEvents = await filterByVisibility(
        [event],
        ctx.user.id,
        ctx.user.role,
        ctx.user.householdId
      );

      if (visibleEvents.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Upsert RSVP
      const rsvpId = await db.upsertRsvp({
        eventId: input.eventId,
        userId: ctx.user.id,
        status: input.status,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "event_rsvp",
        targetType: "event",
        targetId: input.eventId,
        metadata: { status: input.status, rsvpId },
      });

      // Send notification to primary/admin users only when RSVP is "going"
      if (input.status === "going") {
        notifyHouseholdMembers(
          ctx.user.householdId,
          "event_rsvp",
          {
            title: event.title,
            volunteerName: ctx.user.name,
            rsvpStatus: "going",
            eventDate: event.startAt.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            actionUrl: `${process.env.REPL_HOME || ""}/calendar`,
          },
          [ctx.user.id]
        ).catch(err => console.error("Failed to send event_rsvp notification:", err));
      }

      return { rsvpId };
    }),
});

