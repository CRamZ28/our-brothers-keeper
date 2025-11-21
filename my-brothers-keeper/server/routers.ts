import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import crypto from "crypto";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { inviteRouter, sendInviteNotification } from "./inviteRouter";
import { adminMessageRouter, adminGroupRouter } from "./adminRouter";
import { updatesRouter } from "./updatesRouter";
import { needsRouter } from "./needsRouter";
import { eventsRouter } from "./eventsRouter";
import { messagesRouter } from "./messagesRouter";
import { mealTrainRouter } from "./mealTrainRouter";
import { notificationRouter } from "./notificationRouter";
import { memoryWallRouter } from "./memoryWallRouter";
import { giftRegistryRouter } from "./giftRegistryRouter";
import { reminderRouter } from "./reminderRouter";
import { onboardingRouter } from "./onboardingRouter";
import { supportRouter } from "./supportRouter";

// Helper to check if user is Primary or Admin for a household
async function checkHouseholdAccess(
  userId: string,
  householdId: number,
  requireRole?: "primary" | "admin"
) {
  const user = await db.getUserById(userId);
  if (!user || user.householdId !== householdId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to this household" });
  }

  if (requireRole === "primary" && user.role !== "primary") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Primary role required" });
  }

  if (requireRole === "admin" && user.role !== "admin" && user.role !== "primary") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin or Primary role required" });
  }

  return user;
}

export const appRouter = router({
  system: systemRouter,

  invite: inviteRouter,
  adminMessage: adminMessageRouter,
  adminGroup: adminGroupRouter,
  updates: updatesRouter,
  needs: needsRouter,
  events: eventsRouter,
  messages: messagesRouter,
  mealTrain: mealTrainRouter,
  notification: notificationRouter,
  memoryWall: memoryWallRouter,
  giftRegistry: giftRegistryRouter,
  reminder: reminderRouter,
  onboarding: onboardingRouter,
  support: supportRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  household: router({
    // Public endpoint to search households by name (fuzzy matching)
    search: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        const households = await db.searchHouseholds(input.query);
        
        // Return only public-safe information
        return households.map(household => ({
          id: household.id,
          name: household.name,
          description: household.description,
          photoUrl: household.photoUrl,
          slug: household.slug,
        }));
      }),

    // Public endpoint to get household info by slug (for public join page)
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const household = await db.getHouseholdBySlug(input.slug);

        if (!household) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Household not found",
          });
        }

        // Return only public-safe information
        return {
          id: household.id,
          name: household.name,
          description: household.description,
          photoUrl: household.photoUrl,
          slug: household.slug,
        };
      }),

    // Get current user's household
    getMy: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return null;
      }
      return await db.getHousehold(ctx.user.householdId);
    }),

    // Create a new household (for Primary user or Admin setting up on behalf)
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          timezone: z.string().default("America/Chicago"),
          delegateAdminApprovals: z.boolean().default(false),
          setupRole: z.enum(["primary", "admin"]).default("primary"),
          primaryName: z.string().optional(),
          primaryEmail: z.string().email().optional(),
          additionalAdmins: z
            .array(
              z.object({
                id: z.string(),
                name: z.string(),
                email: z.string().email(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validate admin setup has primary details
        if (input.setupRole === "admin" && (!input.primaryName || !input.primaryEmail)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Primary name and email required for admin setup",
          });
        }

        // Create household with current user as temporary primary
        // (will be updated if this is admin setup)
        // Note: slug is auto-generated by createHousehold
        const householdId = await db.createHousehold({
          name: input.name,
          primaryUserId: ctx.user.id,
          timezone: input.timezone,
          delegateAdminApprovals: input.delegateAdminApprovals,
          quietMode: false,
        });

        if (input.setupRole === "primary") {
          // User is setting up for themselves - make them Primary
          await db.upsertUser({
            id: ctx.user.id,
            role: "primary",
            householdId,
            status: "active",
          });
        } else {
          // Admin is setting up for someone else - make current user Admin
          await db.upsertUser({
            id: ctx.user.id,
            role: "admin",
            householdId,
            status: "active",
          });

          // Create invite for the actual primary person
          const inviteToken = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 14); // 14 days expiry for primary invites

          await db.createInvite({
            householdId,
            invitedEmail: input.primaryEmail!,
            invitedPhone: null,
            invitedRole: "primary",
            inviterUserId: ctx.user.id,
            token: inviteToken,
            status: "sent",
            expiresAt,
          });

          // Send primary invite email using token-based link
          const household = await db.getHousehold(householdId);
          if (household) {
            try {
              // For primary invites, use token-based invite link since slug may not be set yet
              // Token link format: /accept-invite?token=...
              const baseUrl = process.env.VITE_APP_URL || "https://obkapp.com";
              const tokenInviteLink = `${baseUrl}/accept-invite?token=${inviteToken}`;

              // Send email with token-based link (works even without slug)
              const Resend = (await import("resend")).Resend;
              const resend = new Resend(process.env.RESEND_API_KEY);
              const FROM_EMAIL = 'Our Brother\'s Keeper <notifications@obkapp.com>';

              const safeInviterName = (ctx.user.name || "An admin").replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] || c));
              const safeHouseholdName = household.name.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] || c));
              const safePrimaryName = (input.primaryName || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] || c));

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
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🤍 Our Brother's Keeper</h1>
                    </div>
                    <div class="content">
                      <p>Hi ${safePrimaryName},</p>
                      <p><strong>${safeInviterName}</strong> has set up a support page for <strong>${safeHouseholdName}</strong> on Our Brother's Keeper.</p>
                      <p>You've been invited to become the <strong>Primary Administrator</strong> of this support circle. As the primary administrator, you'll have full control over settings, supporters, and all aspects of the support page.</p>
                      <div style="background: #f9fafb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                        <p style="margin: 0; font-size: 16px;">Our Brother's Keeper is a compassionate platform designed to help families coordinate support during difficult times.</p>
                      </div>
                      <p>Click the button below to accept this invitation and take control of your support circle.</p>
                      <div style="text-align: center;">
                        <a href="${tokenInviteLink}" class="button">Accept Invitation</a>
                      </div>
                      <p style="color: #666; font-size: 14px; margin-top: 30px;">With care and support,<br>The Our Brother's Keeper Team</p>
                    </div>
                    <div class="footer">
                      <p>You're receiving this email because ${safeInviterName} has invited you to manage ${safeHouseholdName}'s support page.</p>
                      <p style="font-size: 12px; color: #999;">This invitation will expire in 14 days.</p>
                    </div>
                  </div>
                </body>
                </html>
              `;

              await resend.emails.send({
                from: FROM_EMAIL,
                to: input.primaryEmail!,
                subject: `You're Invited to Manage ${safeHouseholdName}'s Support Circle`,
                html: emailHtml,
              });

              console.log(
                `[Household] Primary invite email sent to ${input.primaryName} (${input.primaryEmail})`
              );
            } catch (error) {
              console.error('[Household] Failed to send primary invite email:', error);
              // Don't fail the household creation if email fails
            }
          }
        }

        // Handle additional admin invites
        if (input.additionalAdmins && input.additionalAdmins.length > 0) {
          console.log(
            `[Household] Need to invite ${input.additionalAdmins.length} additional admins:`,
            input.additionalAdmins.map((a) => a.email).join(", ")
          );
          // TODO: Create invites for additional admins
          // This will be handled by the invite system
        }

        // Create default groups
        const innerCircleId = await db.createGroup({
          householdId,
          name: "Inner Circle",
          description: "Closest friends and family",
        });

        const immediateFamilyId = await db.createGroup({
          householdId,
          name: "Immediate Family",
          description: "Direct family members",
        });

        await db.createGroup({
          householdId,
          name: "Church/Community",
          description: "Church members and community friends",
        });

        // Add creator to Inner Circle and Immediate Family
        await db.addUserToGroup(innerCircleId, ctx.user.id);
        await db.addUserToGroup(immediateFamilyId, ctx.user.id);

        // Create audit log
        await db.createAuditLog({
          householdId,
          actorUserId: ctx.user.id,
          action: "household_created",
          targetType: "household",
          targetId: householdId,
          metadata: {
            name: input.name,
            setupRole: input.setupRole,
            primaryEmail: input.primaryEmail,
          },
        });

        return {
          householdId,
          needsPrimaryInvite: input.setupRole === "admin",
          primaryEmail: input.primaryEmail,
          additionalAdminsCount: input.additionalAdmins?.length || 0,
        };
      }),

    // Update household settings
    update: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          quietMode: z.boolean().optional(),
          timezone: z.string().optional(),
          delegateAdminApprovals: z.boolean().optional(),
          showMemorialSubtitle: z.boolean().optional(),
          memorialName: z.string().optional(),
          memorialBirthDate: z.string().optional(),
          memorialPassingDate: z.string().optional(),
          customDashboardMessage: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        const canUpdate = ctx.user.role === "primary" || ctx.user.role === "admin";
        if (!canUpdate) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only Primary or Admin can update household settings",
          });
        }

        await db.updateHousehold(ctx.user.householdId, input);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "household_updated",
          targetType: "household",
          targetId: ctx.user.householdId,
          metadata: input,
        });

        return { success: true };
      }),

    // Get notification preferences for current user
    getNotificationPrefs: protectedProcedure.query(async ({ ctx }) => {
      return await db.getNotificationPrefs(ctx.user.id);
    }),

    // Update notification preferences
    updateNotificationPrefs: protectedProcedure
      .input(
        z.object({
          channelEmail: z.boolean().optional(),
          channelSms: z.boolean().optional(),
          channelPush: z.boolean().optional(),
          digestFrequency: z.enum(["immediate", "daily", "weekly"]).optional(),
          urgentNeedsAlerts: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertNotificationPrefs(ctx.user.id, input);
        return { success: true };
      }),

    // Get recent activity from audit logs
    getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await db.getRecentActivity(ctx.user.householdId, 20);
    }),

    // Allow users to join a household with a requested tier
    joinWithTier: protectedProcedure
      .input(
        z.object({
          householdId: z.number(),
          requestedTier: z.enum(["community", "friend", "family"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.joinHouseholdWithTier(ctx.user.id, input.householdId, input.requestedTier);

        await db.createAuditLog({
          householdId: input.householdId,
          actorUserId: ctx.user.id,
          action: "user_joined_with_tier_request",
          targetType: "user",
          targetId: 0,
          metadata: { userId: ctx.user.id, requestedTier: input.requestedTier },
        });

        return { success: true };
      }),

    // Update auto-promote settings (admin/primary only)
    updateAutoPromoteSettings: protectedProcedure
      .input(
        z.object({
          autoPromoteEnabled: z.boolean().optional(),
          autoPromoteHours: z.number().min(1).max(168).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        await db.updateHouseholdAutoPromote(ctx.user.householdId, input);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "household_auto_promote_updated",
          targetType: "household",
          targetId: ctx.user.householdId,
          metadata: input,
        });

        return { success: true };
      }),

    // Update household slug (admin/primary only)
    updateSlug: protectedProcedure
      .input(
        z.object({
          slug: z
            .string()
            .min(3, "Slug must be at least 3 characters")
            .max(255, "Slug cannot exceed 255 characters")
            .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No household found",
          });
        }

        // Only admin/primary can update slug
        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        // Check if slug is available
        const isAvailable = await db.isSlugAvailable(input.slug, ctx.user.householdId);
        if (!isAvailable) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This slug is already taken",
          });
        }

        // Update slug
        await db.updateHousehold(ctx.user.householdId, { slug: input.slug });

        // Create audit log
        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "household_slug_updated",
          targetType: "household",
          targetId: ctx.user.householdId,
          metadata: { slug: input.slug },
        });

        return {
          success: true,
          slug: input.slug,
        };
      }),

    // Update dashboard display settings (admin/primary only)
    updateDashboardDisplay: protectedProcedure
      .input(
        z.object({
          displayType: z.enum(["none", "photo", "slideshow", "quote", "memory"]),
          photoUrl: z.string().optional(),
          photos: z.array(z.string()).optional(),
          quote: z.string().optional(),
          quoteAttribution: z.string().optional(),
          featuredMemoryId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No household found",
          });
        }

        // Only admin/primary can update dashboard display
        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        // Validate photo requires photo URL
        if (input.displayType === "photo" && !input.photoUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Photo display requires a photo to be uploaded",
          });
        }

        // Validate slideshow requires 3-5 photos
        if (input.displayType === "slideshow") {
          if (!input.photos || input.photos.length < 3 || input.photos.length > 5) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Slideshow requires 3-5 photos",
            });
          }
        }

        // Validate quote requires quote text
        if (input.displayType === "quote" && !input.quote) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Quote display requires quote text",
          });
        }

        // Validate memory requires memory ID
        if (input.displayType === "memory" && !input.featuredMemoryId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Memory display requires a selected memory",
          });
        }

        // Update dashboard display settings
        await db.updateHousehold(ctx.user.householdId, {
          dashboardDisplayType: input.displayType,
          photoUrl: input.photoUrl || null,
          dashboardPhotos: input.photos || [],
          dashboardQuote: input.quote || null,
          dashboardQuoteAttribution: input.quoteAttribution || null,
          dashboardFeaturedMemoryId: input.featuredMemoryId || null,
        });

        // Create audit log
        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "dashboard_display_updated",
          targetType: "household",
          targetId: ctx.user.householdId,
          metadata: { displayType: input.displayType },
        });

        return { success: true };
      }),
  }),

  user: router({
    // Get all users in current household
    listInHousehold: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await db.getUsersByHousehold(ctx.user.householdId);
    }),

    // Update user profile (name, phone, profile picture)
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          profileImageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);

        if (ctx.user.householdId) {
          await db.createAuditLog({
            householdId: ctx.user.householdId,
            actorUserId: ctx.user.id,
            action: "user_profile_updated",
            targetType: "user",
            targetId: 0,
            metadata: { userId: ctx.user.id, updates: input },
          });
        }

        return { success: true };
      }),

    // Update user status (approve/block)
    updateStatus: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
          status: z.enum(["active", "pending", "blocked"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        // Check if user has permission (Primary or Admin with delegation)
        const household = await db.getHousehold(ctx.user.householdId);
        if (!household) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Household not found" });
        }

        const canApprove =
          ctx.user.role === "primary" ||
          (ctx.user.role === "admin" && household.delegateAdminApprovals);

        if (!canApprove) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only Primary or delegated Admin can update user status",
          });
        }

        await db.updateUserStatus(input.userId, input.status);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "user_status_updated",
          targetType: "user",
          targetId: 0, // Placeholder since user IDs are strings
          metadata: { userId: input.userId, status: input.status },
        });

        return { success: true };
      }),

    // Update user role (primary and admin)
    updateRole: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
          role: z.enum(["admin", "supporter"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        // Only primary or admin can change roles
        if (ctx.user.role !== "primary" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only Primary or Admin can change user roles",
          });
        }

        // Get target user to verify they're in the same household
        const targetUser = await db.getUserById(input.userId);
        if (!targetUser) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        if (targetUser.householdId !== ctx.user.householdId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "User belongs to different household" });
        }

        // Can't change your own role
        if (targetUser.id === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change your own role" });
        }

        // Can't change another primary's role
        if (targetUser.role === "primary") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change Primary role" });
        }

        await db.updateUserRole(input.userId, input.role);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "user_role_updated",
          targetType: "user",
          targetId: 0,
          metadata: { userId: input.userId, newRole: input.role },
        });

        return { success: true };
      }),

    // Remove user from household (admin/primary only)
    removeFromHousehold: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        // Only admin or primary can remove users
        if (ctx.user.role !== "admin" && ctx.user.role !== "primary") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only Admin or Primary can remove users from the household",
          });
        }

        // Get target user to verify they're in the same household
        const targetUser = await db.getUserById(input.userId);
        if (!targetUser) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        if (targetUser.householdId !== ctx.user.householdId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "User belongs to different household" });
        }

        // Can't remove yourself
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove yourself from household" });
        }

        // Remove user from household
        await db.removeUserFromHousehold(input.userId, ctx.user.householdId);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "user_removed_from_household",
          targetType: "user",
          targetId: 0,
          metadata: { userId: input.userId, userName: targetUser.name },
        });

        return { success: true };
      }),

    // Get pending tier requests (admin/primary only)
    getPendingTierRequests: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }

      await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

      return await db.getUsersPendingTierApproval(ctx.user.householdId);
    }),

    // Approve tier request (admin/primary only)
    approveTierRequest: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        // Get the user to verify they have a pending request
        const targetUser = await db.getUserById(input.userId);
        if (!targetUser) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        if (targetUser.householdId !== ctx.user.householdId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "User belongs to different household" });
        }

        if (!targetUser.requestedTier) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User has no pending tier request" });
        }

        // Approve the tier request
        await db.updateUserAccessTier(input.userId, targetUser.requestedTier);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "tier_request_approved",
          targetType: "user",
          targetId: 0,
          metadata: { 
            userId: input.userId, 
            approvedTier: targetUser.requestedTier,
            userName: targetUser.name 
          },
        });

        return { success: true };
      }),
  }),

  group: router({
    // List all groups in household
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await db.getGroupsByHousehold(ctx.user.householdId);
    }),

    // Get user's groups
    getMy: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.householdId) {
        return [];
      }
      return await db.getUserGroups(ctx.user.id, ctx.user.householdId);
    }),

    // Create a new group
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        const groupId = await db.createGroup({
          householdId: ctx.user.householdId,
          name: input.name,
          description: input.description,
        });

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "group_created",
          targetType: "group",
          targetId: groupId,
          metadata: { name: input.name },
        });

        return { groupId };
      }),

    // Add user to group
    addMember: protectedProcedure
      .input(
        z.object({
          groupId: z.number(),
          userId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        await db.addUserToGroup(input.groupId, input.userId);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "group_member_added",
          targetType: "group",
          targetId: input.groupId,
          metadata: { userId: input.userId },
        });

        return { success: true };
      }),

    // Remove user from group
    removeMember: protectedProcedure
      .input(
        z.object({
          groupId: z.number(),
          userId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        await db.removeUserFromGroup(input.groupId, input.userId);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "group_member_removed",
          targetType: "group",
          targetId: input.groupId,
          metadata: { userId: input.userId },
        });

        return { success: true };
      }),

    // Update group details
    update: protectedProcedure
      .input(
        z.object({
          groupId: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        await db.updateGroup(input.groupId, {
          name: input.name,
          description: input.description,
        });

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "group_updated",
          targetType: "group",
          targetId: input.groupId,
          metadata: { name: input.name, description: input.description },
        });

        return { success: true };
      }),

    // Delete group
    delete: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
        }

        await checkHouseholdAccess(ctx.user.id, ctx.user.householdId, "admin");

        await db.deleteGroup(input.groupId);

        await db.createAuditLog({
          householdId: ctx.user.householdId,
          actorUserId: ctx.user.id,
          action: "group_deleted",
          targetType: "group",
          targetId: input.groupId,
          metadata: {},
        });

        return { success: true };
      }),

    // Get members of a group
    getMembers: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user.householdId) {
          return [];
        }

        return await db.getGroupMembers(input.groupId);
      }),
  }),
});

export type AppRouter = typeof appRouter;

