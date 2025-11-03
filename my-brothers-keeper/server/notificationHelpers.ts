import { sendBulkNotificationEmails, NotificationType, EmailContext } from './emailService';
import { getUsersByHousehold, getHousehold } from './db';

export async function notifyHouseholdMembers(
  householdId: number,
  notificationType: NotificationType,
  baseContext: Omit<EmailContext, 'recipientName' | 'recipientEmail' | 'householdName'>,
  excludeUserIds: string[] = []
) {
  try {
    const [household, members] = await Promise.all([
      getHousehold(householdId),
      getUsersByHousehold(householdId),
    ]);

    if (!household) {
      console.error(`Household ${householdId} not found for notifications`);
      return;
    }

    const eligibleMembers = members.filter(
      (member) => !excludeUserIds.includes(member.id) && member.status === 'active'
    );

    await sendBulkNotificationEmails(
      eligibleMembers.map((m) => m.id),
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
    console.error('Error sending household notifications:', error);
  }
}

export async function notifySpecificUsers(
  userIds: string[],
  householdId: number,
  notificationType: NotificationType,
  baseContext: Omit<EmailContext, 'recipientName' | 'recipientEmail' | 'householdName'>
) {
  try {
    const household = await getHousehold(householdId);
    if (!household) {
      console.error(`Household ${householdId} not found for notifications`);
      return;
    }

    await sendBulkNotificationEmails(
      userIds,
      householdId,
      notificationType,
      () => ({
        ...baseContext,
        householdName: household.name,
      })
    );
  } catch (error) {
    console.error('Error sending specific user notifications:', error);
  }
}
