import { getDb } from "./db";
import { reminders, needs, events, users } from "../drizzle/schema";
import { sql, eq, and, lte } from "drizzle-orm";
import { sendNotificationEmail, NotificationType } from "./emailService";

/**
 * Process pending reminders - check for reminders that need to be sent
 * and send notification emails to users
 */
export async function processReminders() {
  console.log("[Reminders] Starting reminder processing...");
  
  const db = await getDb();
  if (!db) {
    console.error("[Reminders] Database not available");
    return;
  }

  try {
    // Get all reminders that are queued and due to be sent, OR failed and ready for retry
    const now = new Date();
    const pendingReminders = await db
      .select()
      .from(reminders)
      .where(
        sql`(
          (${reminders.status} = 'queued' AND ${reminders.triggerAt} <= ${now})
          OR
          (${reminders.status} = 'failed' AND ${reminders.retryAt} IS NOT NULL AND ${reminders.retryAt} <= ${now})
        )`
      )
      .limit(100); // Process max 100 reminders per run

    console.log(`[Reminders] Found ${pendingReminders.length} pending reminders`);

    for (const reminder of pendingReminders) {
      try {
        // Reset failed reminders to queued for retry
        if (reminder.status === "failed") {
          await db
            .update(reminders)
            .set({ status: "queued", updatedAt: new Date() })
            .where(eq(reminders.id, reminder.id));
        }

        // Get user details
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, reminder.userId))
          .limit(1);

        if (user.length === 0) {
          console.warn(`[Reminders] User not found for reminder ${reminder.id}`);
          await db
            .update(reminders)
            .set({ 
              status: "cancelled", 
              errorMessage: "User not found",
              updatedAt: new Date() 
            })
            .where(eq(reminders.id, reminder.id));
          continue;
        }

        // Get target details based on type
        let context: any = {};
        let notificationType: NotificationType;
        let actionUrl: string;

        if (reminder.targetType === "personal") {
          notificationType = "personal_reminder";
          actionUrl = `/reminders`;
          context = {
            reminderTitle: reminder.title || "Personal Reminder",
            reminderDescription: reminder.description || "",
          };
        } else if (reminder.targetType === "need") {
          if (!reminder.targetId) {
            console.warn(`[Reminders] Need reminder ${reminder.id} has no targetId`);
            await db
              .update(reminders)
              .set({ 
                status: "cancelled", 
                errorMessage: "Need reminder missing targetId",
                updatedAt: new Date() 
              })
              .where(eq(reminders.id, reminder.id));
            continue;
          }

          const need = await db
            .select()
            .from(needs)
            .where(eq(needs.id, reminder.targetId))
            .limit(1);

          if (need.length === 0) {
            console.warn(`[Reminders] Need not found for reminder ${reminder.id}`);
            await db
              .update(reminders)
              .set({ 
                status: "cancelled", 
                errorMessage: "Need not found",
                updatedAt: new Date() 
              })
              .where(eq(reminders.id, reminder.id));
            continue;
          }

          const needData = need[0];
          notificationType = "need_reminder";
          actionUrl = `/needs`;
          context = {
            needTitle: needData.title,
            needDescription: needData.details || "",
            needDueDate: needData.dueAt ? new Date(needData.dueAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }) : "No due date",
          };
        } else {
          if (!reminder.targetId) {
            console.warn(`[Reminders] Event reminder ${reminder.id} has no targetId`);
            await db
              .update(reminders)
              .set({ 
                status: "cancelled", 
                errorMessage: "Event reminder missing targetId",
                updatedAt: new Date() 
              })
              .where(eq(reminders.id, reminder.id));
            continue;
          }

          const event = await db
            .select()
            .from(events)
            .where(eq(events.id, reminder.targetId))
            .limit(1);

          if (event.length === 0) {
            console.warn(`[Reminders] Event not found for reminder ${reminder.id}`);
            await db
              .update(reminders)
              .set({ 
                status: "cancelled", 
                errorMessage: "Event not found",
                updatedAt: new Date() 
              })
              .where(eq(reminders.id, reminder.id));
            continue;
          }

          const eventData = event[0];
          notificationType = "event_reminder";
          actionUrl = `/events`;
          context = {
            eventTitle: eventData.title,
            eventDescription: eventData.description || "",
            eventStartTime: new Date(eventData.startAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }),
            eventLocation: eventData.location || "",
          };
        }

        // Send reminder email
        await sendNotificationEmail(
          reminder.userId,
          reminder.householdId,
          notificationType,
          {
            ...context,
            actionUrl,
          }
        );

        // Mark reminder as sent
        await db
          .update(reminders)
          .set({ 
            status: "sent", 
            sentAt: new Date(),
            updatedAt: new Date() 
          })
          .where(eq(reminders.id, reminder.id));

        console.log(`[Reminders] Sent ${reminder.targetType} reminder ${reminder.id} to user ${reminder.userId}`);
      } catch (error: any) {
        console.error(`[Reminders] Error processing reminder ${reminder.id}:`, error);
        
        // Mark reminder as failed and set retry
        const retryAt = new Date(Date.now() + 15 * 60 * 1000); // Retry in 15 minutes
        await db
          .update(reminders)
          .set({ 
            status: "failed", 
            errorMessage: error.message || "Unknown error",
            retryAt,
            updatedAt: new Date() 
          })
          .where(eq(reminders.id, reminder.id));
      }
    }

    console.log("[Reminders] Reminder processing completed");
  } catch (error) {
    console.error("[Reminders] Error during reminder processing:", error);
  }
}
