import * as db from "./db";

/**
 * Shared helper to check if a user can view content based on visibility scope
 * Works for events, needs, messages, and any other content with visibility settings
 */
export async function checkContentVisibility(
  userId: string,
  userRole: string,
  householdId: number,
  content: {
    visibilityScope: string;
    visibilityGroupId?: number | null;
    customUserIds?: string[] | null;
  }
): Promise<boolean> {
  const isPrimaryOrAdmin = userRole === "primary" || userRole === "admin";
  
  // Primary and Admin can always see everything
  if (isPrimaryOrAdmin) {
    return true;
  }

  // Check visibility scope
  if (content.visibilityScope === "all_supporters") {
    return true;
  } else if (content.visibilityScope === "role") {
    // Only admin/primary can see (already returned true above)
    return false;
  } else if (content.visibilityScope === "group" && content.visibilityGroupId) {
    // Check if user is in the specified group
    const userGroups = await db.getUserGroups(userId, householdId);
    return userGroups.some((g) => g.id === content.visibilityGroupId);
  } else if (content.visibilityScope === "custom" && content.customUserIds) {
    // Check if user is in the custom user list
    return content.customUserIds.includes(userId);
  } else if (content.visibilityScope === "private") {
    // Only primary/admin can see private content
    return false;
  }

  // Default deny
  return false;
}

/**
 * Filter a list of content items based on visibility
 * Returns only items the user is allowed to see
 */
export async function filterByVisibility<T extends {
  visibilityScope: string;
  visibilityGroupId?: number | null;
  customUserIds?: string[] | null;
}>(
  items: T[],
  userId: string,
  userRole: string,
  householdId: number
): Promise<T[]> {
  const visibleItems: T[] = [];
  
  for (const item of items) {
    const canView = await checkContentVisibility(userId, userRole, householdId, item);
    if (canView) {
      visibleItems.push(item);
    }
  }
  
  return visibleItems;
}
