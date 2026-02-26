import { Resend } from 'resend';
import { getDb } from './db';
import { notificationLogs, notificationPreferences, users } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

// Lazily initialised so the app can start without RESEND_API_KEY in dev
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!_resend && process.env.RESEND_API_KEY) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    const instance = getResend();
    if (!instance) {
      if (prop === "emails") {
        return {
          send: async (...args: any[]) => {
            console.warn("[Email] RESEND_API_KEY not set — email not sent:", args[0]?.subject ?? "");
            return { data: null, error: null };
          },
        };
      }
      return undefined;
    }
    return (instance as any)[prop];
  },
});

export type NotificationType =
  | 'need_created'
  | 'need_claimed'
  | 'need_unclaimed'
  | 'need_completed'
  | 'need_reminder'
  | 'event_created'
  | 'event_rsvp'
  | 'event_reminder'
  | 'meal_train_signup'
  | 'meal_train_cancelled'
  | 'new_message'
  | 'new_announcement'
  | 'new_update'
  | 'invite_sent'
  | 'personal_reminder';

export interface EmailContext {
  recipientName: string;
  recipientEmail: string;
  householdName?: string;
  actionUrl?: string;
  [key: string]: any;
}

const FROM_EMAIL = 'Our Brother\'s Keeper <notifications@obkapp.com>';

function getEmailTemplate(type: NotificationType, context: EmailContext): { subject: string; html: string } {
  const baseStyles = `
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
  `;

  const templates: Record<NotificationType, { subject: string; body: string }> = {
    need_created: {
      subject: `🤝 New Support Request: ${context.needTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>A new support request has been posted to ${context.householdName}'s support circle:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #6BC4B8;">${context.needTitle}</h3>
          <p style="margin: 0;">${context.needDescription}</p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;"><strong>Category:</strong> ${context.needCategory}</p>
        </div>
        <p>If you're able to help, please click the button below to view details and claim this request.</p>
      `
    },
    need_claimed: {
      subject: `✅ Support Request Claimed: ${context.needTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p><strong>${context.claimerName}</strong> has claimed the following support request:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #6BC4B8;">${context.needTitle}</h3>
        </div>
        <p>Thank you for being part of this caring community!</p>
      `
    },
    need_unclaimed: {
      subject: `⚠️ Support Request Available Again: ${context.needTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p><strong>${context.unclaimerName}</strong> has released their claim on the following support request:</p>
        <div style="background: #fff4e6; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #f59e0b;">${context.needTitle}</h3>
        </div>
        <p>This request is now available again if someone else would like to help. Thank you for your flexibility and understanding!</p>
      `
    },
    need_completed: {
      subject: `🎉 Support Request Completed: ${context.needTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>Great news! <strong>${context.completerName}</strong> has completed the following support request:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #B08CA7; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #B08CA7;">${context.needTitle}</h3>
        </div>
        <p>Your support network is making a real difference during this difficult time.</p>
      `
    },
    event_created: {
      subject: `📅 New Event: ${context.eventTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>A new event has been scheduled for ${context.householdName}'s support circle:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #6BC4B8;">${context.eventTitle}</h3>
          <p style="margin: 5px 0;"><strong>📅 When:</strong> ${context.eventDate} at ${context.eventTime}</p>
          ${context.eventLocation ? `<p style="margin: 5px 0;"><strong>📍 Where:</strong> ${context.eventLocation}</p>` : ''}
          ${context.eventDescription ? `<p style="margin: 10px 0 0 0;">${context.eventDescription}</p>` : ''}
        </div>
        <p>Please let us know if you can attend.</p>
      `
    },
    event_rsvp: {
      subject: `👋 ${context.rsvperName} ${context.rsvpStatus} to ${context.eventTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p><strong>${context.rsvperName}</strong> has responded to your event:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #6BC4B8;">${context.eventTitle}</h3>
          <p style="margin: 0; font-size: 18px;"><strong>Response:</strong> ${context.rsvpStatus === 'going' ? '✅ Going' : context.rsvpStatus === 'maybe' ? '🤔 Maybe' : '❌ Can\'t Make It'}</p>
        </div>
      `
    },
    meal_train_signup: {
      subject: `🍽️ ${context.volunteerName} Signed Up for ${context.mealDate}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>Wonderful news! <strong>${context.volunteerName}</strong> has signed up to bring a meal:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${context.mealDate}</p>
          ${context.volunteerNote ? `<p style="margin: 10px 0 0 0;"><strong>Note:</strong> ${context.volunteerNote}</p>` : ''}
        </div>
        <p>The meal train is filling up beautifully thanks to your caring community!</p>
      `
    },
    meal_train_cancelled: {
      subject: `❌ Meal Signup Cancelled for ${context.mealDate}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p><strong>${context.volunteerName}</strong> has cancelled their meal signup for:</p>
        <div style="background: #fff4e6; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${context.mealDate}</p>
        </div>
        <p>This slot is now available if anyone else would like to sign up.</p>
      `
    },
    new_message: {
      subject: `💬 New Message from ${context.senderName}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p><strong>${context.senderName}</strong> sent you a message:</p>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;">${context.messageBody}</p>
        </div>
        <p>Click below to view and respond.</p>
      `
    },
    new_announcement: {
      subject: `📢 Announcement from ${context.householdName}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>${context.householdName} has posted a new announcement:</p>
        <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0; font-weight: 600;">${context.announcementBody}</p>
        </div>
      `
    },
    new_update: {
      subject: `📰 New Update from ${context.householdName}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>${context.householdName} has shared a new update:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #B08CA7; margin: 20px 0;">
          ${context.updateTitle ? `<h3 style="margin: 0 0 10px 0; color: #B08CA7;">${context.updateTitle}</h3>` : ''}
          <p style="margin: 0;">${context.updateBody}</p>
        </div>
      `
    },
    need_reminder: {
      subject: `🔔 Reminder: ${context.needTitle} is coming up`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>This is a friendly reminder about an upcoming support need you set a reminder for:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #6BC4B8; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #6BC4B8;">${context.needTitle}</h3>
          <p style="margin: 0;">${context.needDescription}</p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;"><strong>Due:</strong> ${context.needDueDate}</p>
        </div>
        <p>Click the button below to view the details.</p>
      `
    },
    event_reminder: {
      subject: `🔔 Reminder: ${context.eventTitle} is coming up`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>This is a friendly reminder about an upcoming event you set a reminder for:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #B08CA7; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #B08CA7;">${context.eventTitle}</h3>
          ${context.eventDescription ? `<p style="margin: 0;">${context.eventDescription}</p>` : ''}
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;"><strong>When:</strong> ${context.eventStartTime}</p>
          ${context.eventLocation ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;"><strong>Where:</strong> ${context.eventLocation}</p>` : ''}
        </div>
        <p>Click the button below to view the event details.</p>
      `
    },
    personal_reminder: {
      subject: `🔔 Reminder: ${context.reminderTitle}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p>This is your personal reminder:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #2DB5A8; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #2DB5A8;">${context.reminderTitle}</h3>
          ${context.reminderDescription ? `<p style="margin: 0;">${context.reminderDescription}</p>` : ''}
        </div>
        <p>Take care and remember you're doing great supporting ${context.householdName}!</p>
      `
    },
    invite_sent: {
      subject: `💌 You're Invited to Support ${context.householdName}`,
      body: `
        <p>Hi ${context.recipientName},</p>
        <p><strong>${context.inviterName}</strong> has invited you to join <strong>${context.householdName}'s</strong> support circle on Our Brother's Keeper.</p>
        <div style="background: #f9fafb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0; font-size: 16px;">Our Brother's Keeper is a compassionate platform designed to help families coordinate support during difficult times.</p>
        </div>
        <p>Click the button below to accept the invitation and join this caring community.</p>
      `
    },
  };

  const template = templates[type];
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤍 Our Brother's Keeper</h1>
        </div>
        <div class="content">
          ${template.body}
          ${context.actionUrl ? `<div style="text-align: center;"><a href="${context.actionUrl}" class="button">View Details</a></div>` : ''}
          <div class="divider"></div>
          <p style="color: #666; font-size: 14px; margin: 0;">With care and support,<br>The Our Brother's Keeper Team</p>
        </div>
        <div class="footer">
          <p>You're receiving this email because you're part of ${context.householdName || 'a support circle'}.</p>
          <p style="font-size: 12px; color: #999;">You can manage your notification preferences in your account settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject: template.subject, html };
}

export async function sendNotificationEmail(
  userId: string,
  householdId: number,
  notificationType: NotificationType,
  context: EmailContext
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return;
    }

    const [prefs, user] = await Promise.all([
      db.select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.userId, userId),
            eq(notificationPreferences.householdId, householdId)
          )
        )
        .limit(1),
      db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
    ]);

    if (!user[0]?.email) {
      console.error(`No email found for user ${userId}`);
      return;
    }

    const userPrefs = prefs[0];
    if (!userPrefs || !userPrefs.emailEnabled) {
      return;
    }

    const prefKey = `email${notificationType.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}` as keyof typeof userPrefs;
    if (!userPrefs[prefKey]) {
      return;
    }

    const emailContext: EmailContext = {
      ...context,
      recipientName: context.recipientName || user[0].name || user[0].firstName || 'Friend',
      recipientEmail: user[0].email,
    };

    const { subject, html } = getEmailTemplate(notificationType, emailContext);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: user[0].email,
      subject,
      html,
    });

    await db.insert(notificationLogs).values({
      userId,
      householdId,
      notificationType,
      channel: 'email',
      subject,
      body: html,
      metadata: context,
      delivered: !!result.data?.id,
      deliveredAt: result.data?.id ? new Date() : null,
      error: result.error ? JSON.stringify(result.error) : null,
    });

    if (result.error) {
      console.error('Failed to send email:', result.error);
    }
  } catch (error) {
    console.error('Error sending notification email:', error);
    const db = await getDb();
    if (db) {
      await db.insert(notificationLogs).values({
        userId,
        householdId,
        notificationType,
        channel: 'email',
        subject: 'Error',
        body: '',
        delivered: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export async function sendBulkNotificationEmails(
  userIds: string[],
  householdId: number,
  notificationType: NotificationType,
  contextFn: (userId: string) => EmailContext
): Promise<void> {
  await Promise.all(
    userIds.map(userId => 
      sendNotificationEmail(userId, householdId, notificationType, contextFn(userId))
    )
  );
}
