import { sendBulkNotificationEmails, NotificationType, EmailContext } from './emailService';
import { getUsersByHousehold, getHousehold, getNotificationPreferencesByUser } from './db';

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

    // Get user details and preferences
    const allMembers = await getUsersByHousehold(householdId);
    const eligibleMembers = allMembers.filter(m => eligibleUserIds.includes(m.id) && m.status === 'active');

    // Filter by notification preferences
    const notificationTypePreferenceMap: Record<NotificationType, keyof typeof prefs> = {
      need_created: 'emailNeedCreated',
      need_claimed: 'emailNeedClaimed',
      need_completed: 'emailNeedCompleted',
      event_created: 'emailEventCreated',
      event_rsvp: 'emailEventRsvp',
      meal_train_signup: 'emailMealTrainSignup',
      meal_train_cancelled: 'emailMealTrainCancelled',
      new_message: 'emailNewMessage',
      new_announcement: 'emailNewAnnouncement',
      new_update: 'emailNewUpdate',
      invite_sent: 'emailEnabled', // invites don't have a specific preference
    };

    const membersWithOptIn: string[] = [];
    
    for (const member of eligibleMembers) {
      const prefs = await getNotificationPreferencesByUser(member.id, householdId);
      
      // If no preferences exist, user hasn't opted in (default is all OFF)
      if (!prefs || !prefs.emailEnabled) {
        continue;
      }

      const prefKey = notificationTypePreferenceMap[notificationType];
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
