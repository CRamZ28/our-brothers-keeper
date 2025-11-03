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
    visibilityGroupIds?: number[] | null;
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
  } else if (content.visibilityScope === "group" && content.visibilityGroupIds && content.visibilityGroupIds.length > 0) {
    // Check if user is in ANY of the specified groups
    const userGroups = await db.getUserGroups(userId, householdId);
    const userGroupIds = userGroups.map((g) => g.id);
    return content.visibilityGroupIds.some((groupId) => userGroupIds.includes(groupId));
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
 * Synchronous visibility check that uses pre-fetched user group IDs
 * This avoids N+1 queries when filtering large lists
 * @internal - Use filterByVisibility for most cases
 */
function checkContentVisibilitySync(
  userId: string,
  userRole: string,
  userGroupIds: number[],
  content: {
    visibilityScope: string;
    visibilityGroupIds?: number[] | null;
    customUserIds?: string[] | null;
  }
): boolean {
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
  } else if (content.visibilityScope === "group" && content.visibilityGroupIds && content.visibilityGroupIds.length > 0) {
    // Check if user is in ANY of the specified groups using cached group IDs
    return content.visibilityGroupIds.some((groupId) => userGroupIds.includes(groupId));
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
 * 
 * PERFORMANCE OPTIMIZED: Caches user group membership to avoid N+1 queries
 * For a list of 100 items, this makes 1 DB call instead of up to 100
 */
export async function filterByVisibility<T extends {
  visibilityScope: string;
  visibilityGroupIds?: number[] | null;
  customUserIds?: string[] | null;
}>(
  items: T[],
  userId: string,
  userRole: string,
  householdId: number
): Promise<T[]> {
  // Early return for empty lists
  if (items.length === 0) {
    return [];
  }

  // Cache user's group membership ONCE to avoid N+1 queries
  // This is the key optimization: 1 DB call instead of N calls
  const userGroups = await db.getUserGroups(userId, householdId);
  const userGroupIds = userGroups.map((g) => g.id);
  
  // Now filter synchronously using cached group IDs
  const visibleItems: T[] = [];
  for (const item of items) {
    const canView = checkContentVisibilitySync(userId, userRole, userGroupIds, item);
    if (canView) {
      visibleItems.push(item);
    }
  }
  
  return visibleItems;
}
