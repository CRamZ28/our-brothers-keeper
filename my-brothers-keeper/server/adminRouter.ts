import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { Resend } from "resend";

// Lazily initialised so the app can start without RESEND_API_KEY in dev
let _resendInstance: InstanceType<typeof Resend> | null = null;
function getResend() {
  if (!_resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("[Email] RESEND_API_KEY not set — admin emails will be logged but not sent");
      return null;
    }
    _resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return _resendInstance;
}
const resend = new Proxy({} as InstanceType<typeof Resend>, {
  get(_target, prop) {
    const instance = getResend();
    if (!instance) {
      if (prop === "emails") {
        return {
          send: async (...args: any[]) => {
            console.warn("[Email] RESEND_API_KEY not set — admin email not sent:", JSON.stringify(args[0]?.subject));
            return { data: null, error: null };
          },
        };
      }
      return undefined;
    }
    return (instance as any)[prop];
  },
});
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

// Helper to send broadcast notification emails
async function sendBroadcastEmail(
  recipientEmail: string,
  recipientName: string | null,
  subject: string,
  body: string,
  senderName: string,
  householdName: string
): Promise<{ success: boolean; error?: string }> {
  if (!recipientEmail) {
    return { success: false, error: "No email address provided" };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn("[Broadcast] RESEND_API_KEY not configured - skipping email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    // Escape all user-supplied content
    const safeSenderName = escapeHtml(senderName);
    const safeHouseholdName = escapeHtml(householdName);
    const safeRecipientName = recipientName ? escapeHtml(recipientName) : '';
    const safeSubject = escapeHtml(subject);
    // Preserve line breaks in body but escape HTML
    const safeBody = escapeHtml(body).replace(/\n/g, '<br>');

    const greeting = safeRecipientName ? `Hi ${safeRecipientName},` : 'Hi there,';
    
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
          .message-box { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6BC4B8; }
          .message-title { font-size: 18px; font-weight: bold; color: #1a1a1a; margin-bottom: 12px; }
          .message-body { font-size: 15px; color: #444; line-height: 1.7; }
          .button { display: inline-block; background: #6BC4B8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .badge { display: inline-block; background: #B08CA7; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 ${safeHouseholdName}</h1>
          </div>
          <div class="content">
            <p>${greeting}</p>
            <p><strong>${safeSenderName}</strong> has sent an important message to the support circle:</p>
            <div class="message-box">
              <div class="badge">BROADCAST MESSAGE</div>
              <div class="message-title">${safeSubject}</div>
              <div class="message-body">${safeBody}</div>
            </div>
            <p>You can view this message and respond in the Our Brother's Keeper app.</p>
            <div style="text-align: center;">
              <a href="${process.env.VITE_APP_URL || 'https://obkapp.com'}/dashboard" class="button">View in App</a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">With care and support,<br>The Our Brother's Keeper Team</p>
          </div>
          <div class="footer">
            <p>You're receiving this email as a member of ${safeHouseholdName}'s support circle.</p>
            <p style="font-size: 12px; color: #999;">This is an important message from your family's support coordinator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `[${householdName}] ${subject}`, // Use raw strings for email header
      html: emailHtml,
    });

    console.log(`[Broadcast] Email sent to ${recipientEmail}:`, result);
    return { success: true };
  } catch (error) {
    console.error(`[Broadcast] Failed to send email to ${recipientEmail}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature is only available to admins",
    });
  }
  return next({ ctx });
});

export const adminMessageRouter = router({
  // Send message to supporters
  send: adminProcedure
    .input(
      z.discriminatedUnion("recipientType", [
        z.object({
          recipientType: z.literal("individual"),
          recipientUserId: z.string(),
          subject: z.string().min(1),
          body: z.string().min(1),
          includePrimary: z.boolean(),
        }),
        z.object({
          recipientType: z.literal("group"),
          recipientGroupId: z.number(),
          subject: z.string().min(1),
          body: z.string().min(1),
          includePrimary: z.boolean(),
        }),
        z.object({
          recipientType: z.literal("all"),
          subject: z.string().min(1),
          body: z.string().min(1),
          includePrimary: z.boolean(),
        }),
      ])
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Determine recipient user IDs and group ID for storage
      let recipientIds: string[] = [];
      let recipientGroupId: number | null = null;

      if (input.recipientType === "individual") {
        recipientIds = [input.recipientUserId];
      } else if (input.recipientType === "group") {
        recipientGroupId = input.recipientGroupId;
        const members = await db.getAdminGroupMembers(input.recipientGroupId);
        recipientIds = members.map((m) => m.userId);
      } else {
        // All supporters
        const users = await db.getUsersByHousehold(ctx.user.householdId);
        recipientIds = users
          .filter((u) => u.status === "active" && u.role === "supporter")
          .map((u) => u.id);
      }

      // Add primary if requested
      if (input.includePrimary) {
        const users = await db.getUsersByHousehold(ctx.user.householdId);
        const primary = users.find((u) => u.role === "primary");
        if (primary) {
          recipientIds.push(primary.id);
        }
      }

      // Create admin message
      const messageId = await db.createAdminMessage({
        householdId: ctx.user.householdId,
        senderId: ctx.user.id,
        subject: input.subject,
        body: input.body,
        recipientType: input.recipientType,
        recipientGroupId,
        includedPrimary: input.includePrimary,
      });

      // Create message recipients
      for (const recipientId of recipientIds) {
        await db.createAdminMessageRecipient({
          messageId,
          userId: recipientId,
        });
      }

      // Create audit log
      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "admin_message_sent",
        targetType: "admin_message",
        targetId: messageId,
        metadata: {
          recipientType: input.recipientType,
          recipientCount: recipientIds.length,
          includedPrimary: input.includePrimary,
        },
      });

      // Send email notifications to all recipients
      const household = await db.getHousehold(ctx.user.householdId);
      if (!household) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Household not found" });
      }

      const senderName = ctx.user.name || "An admin";
      let emailsSent = 0;
      let emailsFailed = 0;

      for (const recipientId of recipientIds) {
        const recipient = await db.getUserById(recipientId);
        if (recipient && recipient.email) {
          const result = await sendBroadcastEmail(
            recipient.email,
            recipient.name,
            input.subject,
            input.body,
            senderName,
            household.name
          );
          
          if (result.success) {
            emailsSent++;
          } else {
            emailsFailed++;
            console.warn(`[Broadcast] Failed to send email to ${recipient.email}:`, result.error);
          }
        } else {
          console.warn(`[Broadcast] Skipping user ${recipientId} - no email address`);
        }
      }

      console.log(`[Broadcast] Sent ${emailsSent} emails, ${emailsFailed} failed out of ${recipientIds.length} total recipients`);

      return { 
        success: true, 
        messageId, 
        recipientCount: recipientIds.length,
        emailsSent,
        emailsFailed 
      };
    }),

  // List sent messages
  listSent: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    return await db.getAdminMessagesByHousehold(ctx.user.householdId);
  }),
});

export const adminGroupRouter = router({
  // Create custom group
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        memberIds: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Create group
      const groupId = await db.createAdminGroup({
        householdId: ctx.user.householdId,
        createdBy: ctx.user.id,
        name: input.name,
        description: input.description || null,
      });

      // Add members
      for (const memberId of input.memberIds) {
        await db.addAdminGroupMember({
          groupId,
          userId: memberId,
        });
      }

      // Create audit log
      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "admin_group_created",
        targetType: "admin_group",
        targetId: groupId,
        metadata: { memberCount: input.memberIds.length },
      });

      return { success: true, groupId };
    }),

  // List admin groups
  list: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.user.householdId) {
      return [];
    }
    return await db.getAdminGroupsByHousehold(ctx.user.householdId);
  }),

  // Delete group
  delete: adminProcedure
    .input(
      z.object({
        groupId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.householdId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No household found" });
      }

      // Verify group belongs to household
      const group = await db.getAdminGroup(input.groupId);
      if (!group || group.householdId !== ctx.user.householdId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Group not found" });
      }

      await db.deleteAdminGroup(input.groupId);

      await db.createAuditLog({
        householdId: ctx.user.householdId,
        actorUserId: ctx.user.id,
        action: "admin_group_deleted",
        targetType: "admin_group",
        targetId: input.groupId,
        metadata: {},
      });

      return { success: true };
    }),
});

