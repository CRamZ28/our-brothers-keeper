import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  // Never leak internal error details (DB / third-party provider messages) to
  // clients. Validation and explicit TRPCError messages still pass through.
  errorFormatter({ shape, error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      return { ...shape, message: "Internal server error" };
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Onboarding/self mutations a not-yet-active member is still allowed to perform
// (so a brand-new user — who starts as "pending" — can still join/create a
// household and set up their profile).
const ONBOARDING_MUTATIONS = new Set([
  "household.create",
  "household.joinWithTier",
  "invite.accept",
  "user.updateProfile",
]);

const requireUser = t.middleware(async opts => {
  const { ctx, next, path, type } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Block access for blocked users
  if (ctx.user.status === "blocked") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your access has been blocked. Please contact the household administrator."
    });
  }

  // Pending (not-yet-approved) members may READ (reads are already tier-gated)
  // but cannot perform actions until a household admin approves them — except the
  // onboarding steps above. This makes the approval workflow actually enforce
  // something instead of being cosmetic.
  if (
    ctx.user.status !== "active" &&
    type === "mutation" &&
    !ONBOARDING_MUTATIONS.has(path)
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your membership is pending approval by a household admin.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    // Unapproved (pending) members must not perform admin actions.
    if (ctx.user.status !== "active") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Your membership must be approved before you can use admin features.",
      });
    }

    if (ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
