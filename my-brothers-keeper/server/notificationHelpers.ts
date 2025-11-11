import { sendBulkNotificationEmails, NotificationType, EmailContext } from './emailService';
import { getUsersByHousehold, getHousehold, getDb } from './db';
import { notificationPreferences } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Send notifications to household members who:
 * 1. Are in the targetUserIds list (pre-filtered by visibility)
 * 2. Have opted in to this notification type
 * 3. Are not in the excludeUserIds list (typically the actor)
 */
export async function notifyVisibleUsers(
  householdId: number,
  targetUserIds: string[],
  notificationType: NotificationType,
  baseContext: Omit<EmailContext, 'recipientName' | 'recipientEmail' | 'householdName'>,
  excludeUserIds: string[] = []
) {
  try {
    const household = await getHousehold(householdId);
    if (!household) {
      console.error(`Household ${householdId} not found for notifications`);
      return;
    }

    // Filter out excluded users
    const eligibleUserIds = targetUserIds.filter(id => !excludeUserIds.includes(id));
    
    if (eligibleUserIds.length === 0) {
      return; // No one to notify
    }

    // Get user details
    const allMembers = await getUsersByHousehold(householdId);
    const eligibleMembers = allMembers.filter(m => eligibleUserIds.includes(m.id) && m.status === 'active');

    // Filter by notification preferences
    const notificationTypePreferenceMap: Record<NotificationType, string> = {
      need_created: 'emailNeedCreated',
      need_claimed: 'emailNeedClaimed',
      need_unclaimed: 'emailNeedUnclaimed',
      need_completed: 'emailNeedCompleted',
      need_reminder: 'emailNeedReminder',
      event_created: 'emailEventCreated',
      event_rsvp: 'emailEventRsvp',
      event_reminder: 'emailEventReminder',
      meal_train_signup: 'emailMealTrainSignup',
      meal_train_cancelled: 'emailMealTrainCancelled',
      new_message: 'emailNewMessage',
      new_announcement: 'emailNewAnnouncement',
      new_update: 'emailNewUpdate',
      invite_sent: 'emailEnabled', // invites don't have a specific preference
    };

    const membersWithOptIn: string[] = [];
    const db = await getDb();
    
    if (!db) {
      console.error('Database not available for notification preferences check');
      return;
    }
    
    for (const member of eligibleMembers) {
      const prefsResult = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.userId, member.id),
            eq(notificationPreferences.householdId, householdId)
          )
        )
        .limit(1);
      
      const prefs = prefsResult[0];
      
      // If no preferences exist, user hasn't opted in (default is all OFF)
      if (!prefs || !prefs.emailEnabled) {
        continue;
      }

      const prefKey = notificationTypePreferenceMap[notificationType] as keyof typeof prefs;
      if (prefs[prefKey]) {
        membersWithOptIn.push(member.id);
      }
    }

    if (membersWithOptIn.length === 0) {
      console.log(`No users opted in for ${notificationType} notifications`);
      return;
    }

    // Send notifications to opted-in users
    await sendBulkNotificationEmails(
      membersWithOptIn,
      householdId,
      notificationType,
      (userId) => ({
        ...baseContext,
        householdName: household.name,
        recipientName: eligibleMembers.find((m) => m.id === userId)?.name || 'Friend',
        recipientEmail: eligibleMembers.find((m) => m.id === userId)?.email || '',
      })
    );
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}
