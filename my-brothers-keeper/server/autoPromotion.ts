import { sql } from "drizzle-orm";
import * as db from "./db";

export async function processAutoPromotions() {
  try {
    console.log("[AutoPromotion] Starting auto-promotion process...");

    const database = await db.getDb();
    if (!database) {
      console.warn("[AutoPromotion] Database not available");
      return;
    }

    const { households, users } = await import("../drizzle/schema");
    
    const householdsWithAutoPromote = await database
      .select()
      .from(households)
      .where(sql`${households.autoPromoteEnabled} = true`);

    console.log(`[AutoPromotion] Found ${householdsWithAutoPromote.length} households with auto-promote enabled`);

    for (const household of householdsWithAutoPromote) {
      const autoPromoteHours = household.autoPromoteHours || 48;
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - autoPromoteHours);

      const eligibleUsers = await database
        .select()
        .from(users)
        .where(
          sql`${users.householdId} = ${household.id} 
              AND ${users.requestedTier} IS NOT NULL 
              AND ${users.requestedTier} != ${users.accessTier}
              AND ${users.tierRequestedAt} IS NOT NULL
              AND ${users.tierRequestedAt} <= ${cutoffTime}`
        );

      console.log(
        `[AutoPromotion] Household ${household.id} (${household.name}): Found ${eligibleUsers.length} users eligible for auto-promotion`
      );

      for (const user of eligibleUsers) {
        if (!user.requestedTier) continue;

        console.log(
          `[AutoPromotion] Promoting user ${user.id} (${user.name || user.email}) from ${user.accessTier} to ${user.requestedTier}`
        );

        await db.updateUserAccessTier(user.id, user.requestedTier);

        await db.createAuditLog({
          householdId: household.id,
          actorUserId: user.id,
          action: "tier_auto_promoted",
          targetType: "user",
          targetId: 0,
          metadata: {
            userId: user.id,
            userName: user.name || user.email,
            fromTier: user.accessTier,
            toTier: user.requestedTier,
            requestedAt: user.tierRequestedAt,
            autoPromoteHours: autoPromoteHours,
          },
        });
      }
    }

    console.log("[AutoPromotion] Auto-promotion process completed");
  } catch (error) {
    console.error("[AutoPromotion] Error during auto-promotion:", error);
  }
}
