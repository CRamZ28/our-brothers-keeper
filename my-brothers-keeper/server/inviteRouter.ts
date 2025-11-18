import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Our Brother\'s Keeper <notifications@obkapp.com>';

// Helper to escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Helper to generate secure invite token
function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Helper to send invite notification
async function sendInviteNotification(
  email: string | null,
  phone: string | null,
  householdSlug: string,
  householdName: string,
  inviterName: string
) {
  // Build public household join link using slug (e.g., /theramseys)
  const baseUrl = process.env.VITE_APP_URL || "https://obkapp.com";
  const inviteLink = `${baseUrl}/${householdSlug}`;
  
  // Only send email if email is provided
  if (email) {
    try {
      // Escape all user-supplied content to prevent HTML injection
      const safeInviterName = escapeHtml(inviterName);
      const safeHouseholdName = escapeHtml(householdName);
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6BC4B8 0%, #5A9FD4 50%, #9B7FB8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #6BC4B8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🤍 Our Brother's Keeper</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p><strong>${safeInviterName}</strong> has invited you to join <strong>${safeHouseholdName}'s</strong> support circle on Our Brother's Keeper.</p>
              <div style="background: #f9fafb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; font-size: 16px;">Our Brother's Keeper is a compassionate platform designed to help families coordinate support during difficult times.</p>
              </div>
              <p>Click the button below to join this caring community and see how you can help.</p>
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">Join Support Circle</a>
              </div>
              <div class="divider"></div>
              <p style="color: #666; font-size: 14px; margin: 0;">With care and support,<br>The Our Brother's Keeper Team</p>
            </div>
            <div class="footer">
              <p>You're receiving this email because ${safeInviterName} invited you to support ${safeHouseholdName}.</p>
              <p style="font-size: 12px; color: #999;">If you don't want to join, you can simply ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `💌 You're Invited to Support ${safeHouseholdName}`,
        html: emailHtml,
      });

      if (result.error) {
        console.error('[Invite] Email send failed:', result.error);
        throw new Error(`Failed to send invite email: ${result.error.message}`);
      }

      console.log(`[Invite] Email sent successfully to ${email}: ${inviteLink}`, result.data);
    } catch (error) {
      console.error('[Invite] Error sending email:', error);
      throw error;
    }
  }

  // SMS sending would go here if phone is provided
  if (phone) {
    console.log(`[Invite] SMS not yet implemented for ${phone}: ${inviteLink}`);
  }

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

      // All supporters can now invite to expand the support network
      const canInvite =
        ctx.user.role === "primary" ||
        ctx.user.role === "admin" ||
        ctx.user.role === "supporter";

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

      // Ensure household has a slug before creating invite
      if (!household.slug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please set a household page URL in Settings before sending invites",
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

      // Send notification with household slug
      const inviteLink = await sendInviteNotification(
        input.email || null,
        input.phone || null,
        household.slug,
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

      // Ensure household has a slug before resending invite
      if (!household.slug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please set a household page URL in Settings before sending invites",
        });
      }

      // Update invite status (no longer using tokens, just marking as resent)
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      await db.updateInvite(input.inviteId, {
        token: generateInviteToken(), // Keep token for backward compatibility but not used
        expiresAt: newExpiresAt,
        status: "sent",
      });

      // Send notification with household page link
      await sendInviteNotification(
        invite.invitedEmail,
        invite.invitedPhone,
        household.slug, // Use household slug
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

