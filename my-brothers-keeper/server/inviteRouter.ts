import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import crypto from "crypto";

// Helper to generate secure invite token
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Helper to send invite notification (placeholder for now)
async function sendInviteNotification(
  email: string | null,
  phone: string | null,
  token: string,
  householdName: string,
  inviterName: string
) {
  // TODO: Implement actual email/SMS sending
  const inviteLink = `${process.env.VITE_APP_URL || "http://localhost:3000"}/invite/${token}`;
  console.log(`[Invite] Would send to ${email || phone}: ${inviteLink}`);
  return inviteLink;
}

export const inviteRouter = router({
  // Create a new invite with AI-powered personalization
  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.enum(["admin", "supporter"]),
        personalMessage: z.string().optional(),
        relationship: z.string().optional(), // e.g., "close friend", "church member", "family"
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Verify user has permission to invite
      const household = await db.getHousehold(ctx.user.householdId);
      if (!household) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Household not found" });
      }

      const canInvite =
        ctx.user.role === "primary" ||
        ctx.user.role === "admin" ||
        (ctx.user.role === "supporter" && household.delegateAdminApprovals);

      if (!canInvite) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to send invites",
        });
      }

      if (!input.email && !input.phone) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either email or phone is required",
        });
      }

      // Generate AI-powered invite message if personalMessage is provided
      let enhancedMessage = input.personalMessage;
      if (input.personalMessage && input.relationship) {
        try {
          const aiResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are helping craft a compassionate, warm invitation message for a support network app called "My Brother's Keeper". The app helps families coordinate support after losing a loved one. Your task is to enhance the personal message while keeping it authentic and heartfelt. Keep it concise (2-3 sentences max).`,
              },
              {
                role: "user",
                content: `Enhance this invite message for a ${input.relationship}:\n\n"${input.personalMessage}"\n\nMake it warm but not overly formal. The person being invited will be a ${input.role} in the support network for ${household.name}.`,
              },
            ],
          });

          const aiContent = aiResponse.choices[0]?.message?.content;
          if (aiContent && typeof aiContent === "string") {
            enhancedMessage = aiContent.trim();
          }
        } catch (error) {
          console.error("[Invite] AI enhancement failed:", error);
          // Fall back to original message
        }
      }

      // Create invite token
      const token = generateInviteToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invite record
      const inviteId = await db.createInvite({
        householdId: ctx.user.householdId,
        invitedEmail: input.email || null,
        invitedPhone: input.phone || null,
        invitedRole: input.role,
        inviterUserId: ctx.user.id,
        token,
        status: "sent",
        expiresAt,
      });

      // Send notification
      const inviteLink = await sendInviteNotification(
        input.email || null,
        input.phone || null,
        token,
        household.name,
        ctx.user.name || "A friend"
      );

      // Create audit log
      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "invite_sent",
        targetType: "invite",
        targetId: inviteId,
        metadata: {
          email: input.email,
          phone: input.phone,
          role: input.role,
          relationship: input.relationship,
        },
      });

      return {
        inviteId,
        token,
        inviteLink,
        enhancedMessage,
      };
    }),

  // Get invite by token (public endpoint for invite acceptance page)
  getByToken: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      const invite = await db.getInviteByToken(input.token);
      if (!invite) {
        return null;
      }

      // Get household name and inviter name
      const household = await db.getHousehold(invite.householdId);
      const inviter = await db.getUserById(invite.inviterUserId);

      return {
        id: invite.id,
        status: invite.status,
        role: invite.invitedRole,
        email: invite.invitedEmail,
        message: null, // Message is not stored in DB, it's generated on-the-fly
        householdName: household?.name || "Unknown Household",
        inviterName: inviter?.name || "Someone",
        expiresAt: invite.expiresAt,
      };
    }),

  // Accept an invite
  accept: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get invite
      const invite = await db.getInviteByToken(input.token);
      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }

      if (invite.status !== "sent") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invite already used or expired" });
      }

      if (new Date() > invite.expiresAt) {
        await db.updateInviteStatus(invite.id, "expired");
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invite has expired" });
      }

      // Get household to check delegation settings
      const household = await db.getHousehold(invite.householdId);
      if (!household) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Household not found" });
      }

      // Update user with household and role, set status to pending
      await db.upsertUser({
        id: ctx.user.id,
        householdId: invite.householdId,
        role: invite.invitedRole,
        status: "pending", // Requires approval
      });

      // Mark invite as accepted
      await db.updateInviteStatus(invite.id, "accepted");

      // Note: Notification preferences are auto-created when user first accesses Settings
      // (handled by notificationRouter.getPreferences endpoint with default values)

      // Create audit log
      await db.createAuditLog({
        householdId: invite.householdId,
        actorUserId: ctx.user.id,
        action: "invite_accepted",
        targetType: "invite",
        targetId: invite.id,
        metadata: { role: invite.invitedRole },
      });

      // TODO: Send notification to Primary or Admin (based on delegation) for approval

      return {
        success: true,
        householdId: invite.householdId,
        requiresApproval: true,
        delegatedToAdmin: household.delegateAdminApprovals,
      };
    }),

  // List pending invites (for Primary/Admin)
  listPending: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }

    const household = await db.getHousehold(ctx.user.householdId);
    if (!household) {
      return [];
    }

    const canView =
      ctx.user.role === "primary" ||
      (ctx.user.role === "admin" && household.delegateAdminApprovals);

    if (!canView) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only Primary or delegated Admin can view pending invites",
      });
    }

    return await db.getPendingInvitesByHousehold(ctx.user.householdId);
  }),

  // Resend an invite
  resend: protectedProcedure
    .input(
      z.object({
        inviteId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      const household = await db.getHousehold(ctx.user.householdId);
      if (!household) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Household not found" });
      }

      const canResend =
        ctx.user.role === "primary" ||
        (ctx.user.role === "admin" && household.delegateAdminApprovals);

      if (!canResend) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary or delegated Admin can resend invites",
        });
      }

      // Get the invite to resend
      const invite = await db.getInviteById(input.inviteId);
      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }

      if (invite.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invite belongs to different household" });
      }

      // Generate new token and extend expiration
      const newToken = generateInviteToken();
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      await db.updateInvite(input.inviteId, {
        token: newToken,
        expiresAt: newExpiresAt,
        status: "sent",
      });

      // Send notification with new link
      await sendInviteNotification(
        invite.invitedEmail,
        invite.invitedPhone,
        newToken,
        household.name,
        ctx.user.name || "Someone"
      );

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "invite_resent",
        targetType: "invite",
        targetId: input.inviteId,
        metadata: {},
      });

      return { success: true };
    }),

  // Revoke an invite
  revoke: protectedProcedure
    .input(
      z.object({
        inviteId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      const household = await db.getHousehold(ctx.user.householdId);
      if (!household) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Household not found" });
      }

      const canRevoke =
        ctx.user.role === "primary" ||
        (ctx.user.role === "admin" && household.delegateAdminApprovals);

      if (!canRevoke) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Primary or delegated Admin can revoke invites",
        });
      }

      await db.updateInviteStatus(input.inviteId, "revoked");

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "invite_revoked",
        targetType: "invite",
        targetId: input.inviteId,
        metadata: {},
      });

      return { success: true };
    }),
});

