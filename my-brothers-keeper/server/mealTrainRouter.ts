import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { notifyVisibleUsers } from "./notificationHelpers";

// Helper function to check if user can view meal train
async function checkMealTrainVisibility(
  userId: string,
  userRole: string,
  householdId: number,
  mealTrain: any
): Promise<boolean> {
  const isPrimaryOrAdmin = userRole === "primary" || userRole === "admin";
  if (isPrimaryOrAdmin) {
    return true;
  }

  if (mealTrain.visibilityScope === "all_supporters") {
    return true;
  } else if (mealTrain.visibilityScope === "role") {
    return userRole === "admin" || userRole === "primary";
  } else if (mealTrain.visibilityScope === "group" && mealTrain.visibilityGroupId) {
    const userGroups = await db.getUserGroups(userId, householdId);
    return userGroups.some((g) => g.id === mealTrain.visibilityGroupId);
  } else if (mealTrain.visibilityScope === "private") {
    return false;
  }

  return false;
}

// Helper function to check if user can see the address
async function checkAddressVisibility(
  userId: string,
  userRole: string,
  householdId: number,
  mealTrain: any
): Promise<boolean> {
  const isPrimaryOrAdmin = userRole === "primary" || userRole === "admin";
  if (isPrimaryOrAdmin) {
    return true;
  }

  if (mealTrain.addressVisibilityScope === "all_supporters") {
    return true;
  } else if (mealTrain.addressVisibilityScope === "role") {
    return userRole === "admin" || userRole === "primary";
  } else if (mealTrain.addressVisibilityScope === "group" && mealTrain.addressVisibilityGroupId) {
    const userGroups = await db.getUserGroups(userId, householdId);
    return userGroups.some((g) => g.id === mealTrain.addressVisibilityGroupId);
  } else if (mealTrain.addressVisibilityScope === "private") {
    return false;
  }

  return false;
}

export const mealTrainRouter = router({
  // Get the meal train configuration for the household
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return null;
    }

    const mealTrain = await db.getMealTrainByHousehold(ctx.user.householdId);
    if (!mealTrain) {
      return null;
    }

    // Check if user can see the meal train
    const canViewMealTrain = await checkMealTrainVisibility(
      ctx.user.id,
      ctx.user.role,
      ctx.user.householdId,
      mealTrain
    );

    if (!canViewMealTrain) {
      return null;
    }

    // Check if user can see the address
    const canSeeAddress = await checkAddressVisibility(
      ctx.user.id,
      ctx.user.role,
      ctx.user.householdId,
      mealTrain
    );

    // Return meal train with address only if user has permission
    return {
      ...mealTrain,
      location: canSeeAddress ? mealTrain.location : null,
    };
  }),

  // Get all meal signups for the household's meal train
  listSignups: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }

    const mealTrain = await db.getMealTrainByHousehold(ctx.user.householdId);
    if (!mealTrain) {
      return [];
    }

    // Check if user can see the meal train
    const canViewMealTrain = await checkMealTrainVisibility(
      ctx.user.id,
      ctx.user.role,
      ctx.user.householdId,
      mealTrain
    );

    if (!canViewMealTrain) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to view this meal train",
      });
    }

    return await db.getMealSignupsByMealTrain(mealTrain.id);
  }),

  // Get meal train days
  getDays: protectedProcedure
    .input(z.object({ mealTrainId: z.number() }))
    .query(async ({ input }) => {
      return await db.getMealTrainDays(input.mealTrainId);
    }),

  // Create or update meal train configuration (admin/primary only)
  upsert: protectedProcedure
    .input(
      z.object({
        location: z.string().optional(),
        peopleCount: z.number().optional(),
        favoriteMeals: z.string().optional(),
        allergies: z.string().optional(),
        dislikes: z.string().optional(),
        specialInstructions: z.string().optional(),
        dailyCapacity: z.number().min(1).max(10).default(1),
        visibilityScope: z
          .enum(["private", "all_supporters", "group", "role"])
          .default("all_supporters"),
        visibilityGroupId: z.number().optional(),
        addressVisibilityScope: z
          .enum(["private", "all_supporters", "group", "role"])
          .default("all_supporters"),
        addressVisibilityGroupId: z.number().optional(),
        enabled: z.boolean().default(true),
        daysAheadOpen: z.number().min(1).max(365).optional(),
        availabilityStartDate: z.string().optional(),
        availabilityEndDate: z.string().optional(),
        selectedDates: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Only Primary or Admin can configure meal train
      const canConfigure = ctx.user.role === "primary" || ctx.user.role === "admin";
      if (!canConfigure) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary or Admin can configure meal train",
        });
      }

      const existingMealTrain = await db.getMealTrainByHousehold(ctx.user.householdId);

      let mealTrainId: number;

      if (existingMealTrain) {
        // Update existing
        await db.updateMealTrain(existingMealTrain.id, {
          location: input.location || null,
          peopleCount: input.peopleCount || null,
          favoriteMeals: input.favoriteMeals || null,
          allergies: input.allergies || null,
          dislikes: input.dislikes || null,
          specialInstructions: input.specialInstructions || null,
          dailyCapacity: input.dailyCapacity,
          visibilityScope: input.visibilityScope,
          visibilityGroupId: input.visibilityGroupId || null,
          addressVisibilityScope: input.addressVisibilityScope,
          addressVisibilityGroupId: input.addressVisibilityGroupId || null,
          enabled: input.enabled,
          daysAheadOpen: input.daysAheadOpen || null,
          availabilityStartDate: input.availabilityStartDate || null,
          availabilityEndDate: input.availabilityEndDate || null,
        });

        mealTrainId = existingMealTrain.id;

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "meal_train_updated",
          targetType: "meal_train",
          targetId: existingMealTrain.id,
          metadata: input,
        });
      } else {
        // Create new
        mealTrainId = await db.createMealTrain({
          householdId: ctx.user.householdId,
          location: input.location || null,
          peopleCount: input.peopleCount || null,
          favoriteMeals: input.favoriteMeals || null,
          allergies: input.allergies || null,
          dislikes: input.dislikes || null,
          specialInstructions: input.specialInstructions || null,
          dailyCapacity: input.dailyCapacity,
          visibilityScope: input.visibilityScope,
          visibilityGroupId: input.visibilityGroupId || null,
          addressVisibilityScope: input.addressVisibilityScope,
          addressVisibilityGroupId: input.addressVisibilityGroupId || null,
          enabled: input.enabled,
          daysAheadOpen: input.daysAheadOpen || null,
          availabilityStartDate: input.availabilityStartDate || null,
          availabilityEndDate: input.availabilityEndDate || null,
          createdBy: ctx.user.id,
        });

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "meal_train_created",
          targetType: "meal_train",
          targetId: mealTrainId,
          metadata: input,
        });
      }

      // Save meal train days if provided
      if (input.selectedDates && input.selectedDates.length > 0) {
        const dates = input.selectedDates.map(d => new Date(d));
        await db.saveMealTrainDays(mealTrainId, dates);
      }

      return { mealTrainId };
    }),

  // Volunteer to deliver a meal on a specific date
  volunteer: protectedProcedure
    .input(
      z.object({
        deliveryDate: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      const mealTrain = await db.getMealTrainByHousehold(ctx.user.householdId);
      if (!mealTrain) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meal train not configured" });
      }

      // Check if user can see the meal train
      const canViewMealTrain = await checkMealTrainVisibility(
        ctx.user.id,
        ctx.user.role,
        ctx.user.householdId,
        mealTrain
      );

      if (!canViewMealTrain) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to volunteer for this meal train",
        });
      }

      if (!mealTrain.enabled) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Meal train is not currently active" });
      }

      // Check if the specific day is available
      const dateString = input.deliveryDate.toISOString().split('T')[0];
      const isAvailable = await db.isMealDayAvailable(mealTrain.id, dateString);
      if (!isAvailable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This day is not available for meal signups",
        });
      }

      // Check capacity for this date
      const existingSignups = await db.getMealSignupsByMealTrain(mealTrain.id);
      const signupsForDate = existingSignups.filter((s) => {
        const signupDate = new Date(s.deliveryDate);
        const targetDate = new Date(input.deliveryDate);
        return (
          signupDate.getFullYear() === targetDate.getFullYear() &&
          signupDate.getMonth() === targetDate.getMonth() &&
          signupDate.getDate() === targetDate.getDate() &&
          s.status !== "cancelled"
        );
      });

      const dailyCapacity = mealTrain.dailyCapacity || 1;
      if (signupsForDate.length >= dailyCapacity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This date is full. Maximum ${dailyCapacity} volunteer(s) per day.`,
        });
      }

      const signupId = await db.createMealSignup({
        mealTrainId: mealTrain.id,
        userId: ctx.user.id,
        deliveryDate: input.deliveryDate,
        status: "confirmed",
        notes: input.notes || null,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "meal_signup_created",
        targetType: "meal_signup",
        targetId: signupId,
        metadata: { deliveryDate: input.deliveryDate },
      });

      // Send notification to primary/admin users
      const allMembers = await db.getUsersByHousehold(ctx.user.householdId);
      const adminUserIds = allMembers
        .filter(m => m.role === "primary" || m.role === "admin")
        .map(m => m.id);

      notifyVisibleUsers(
        ctx.user.householdId,
        adminUserIds,
        "meal_train_signup",
        {
          volunteerName: ctx.user.name,
          mealDate: input.deliveryDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          volunteerNote: input.notes || "No special notes provided.",
          actionUrl: `${process.env.REPL_HOME || ""}/meal-train`,
        },
        [ctx.user.id]
      ).catch((err: Error) => console.error("Failed to send meal_train_signup notification:", err));

      return { signupId };
    }),

  // Update a meal signup (change notes or mark as completed)
  updateSignup: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        notes: z.string().optional(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      const signup = await db.getMealSignup(input.id);
      if (!signup) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Signup not found" });
      }

      // Only the volunteer or admin/primary can update
      const canUpdate =
        signup.userId === ctx.user.id || ctx.user.role === "primary" || ctx.user.role === "admin";
      if (!canUpdate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the volunteer or admin can update this signup",
        });
      }

      const { id, ...updateData } = input;
      await db.updateMealSignup(id, {
        ...updateData,
        completedAt: input.status === "completed" ? new Date() : undefined,
      });

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "meal_signup_updated",
        targetType: "meal_signup",
        targetId: id,
        metadata: updateData,
      });

      return { success: true };
    }),

  // Cancel a meal signup
  cancelSignup: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      const signup = await db.getMealSignup(input.id);
      if (!signup) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Signup not found" });
      }

      // Only the volunteer or admin/primary can cancel
      const canCancel =
        signup.userId === ctx.user.id || ctx.user.role === "primary" || ctx.user.role === "admin";
      if (!canCancel) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the volunteer or admin can cancel this signup",
        });
      }

      await db.deleteMealSignup(input.id);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "meal_signup_cancelled",
        targetType: "meal_signup",
        targetId: input.id,
        metadata: null,
      });

      // Send notification to primary/admin users
      const allMembers = await db.getUsersByHousehold(ctx.user.householdId);
      const adminUserIds = allMembers
        .filter(m => m.role === "primary" || m.role === "admin")
        .map(m => m.id);

      notifyVisibleUsers(
        ctx.user.householdId,
        adminUserIds,
        "meal_train_cancelled",
        {
          volunteerName: ctx.user.name,
          mealDate: signup.deliveryDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          actionUrl: `${process.env.REPL_HOME || ""}/meal-train`,
        },
        [ctx.user.id]
      ).catch((err: Error) => console.error("Failed to send meal_train_cancelled notification:", err));

      return { success: true };
    }),
});
