import * as db from "./db";
import { ObjectStorageService } from "./objectStorage";
import fs from "fs/promises";
import path from "path";

/**
 * Migration script to move photos from local /uploads/ folder to object storage
 * This fixes the issue where photos disappear after redeployment
 */
export async function migratePhotosToObjectStorage() {
  console.log("[Photo Migration] Starting photo migration to object storage...");
  
  const objectStorageService = new ObjectStorageService();
  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    // Get all households with photo URLs
    const householdsWithPhotos = await db.getAllHouseholds();

    console.log(`[Photo Migration] Found ${householdsWithPhotos.length} households to check`);

    for (const household of householdsWithPhotos) {
      // Skip if photo URL is null or undefined
      if (!household.photoUrl) {
        continue;
      }

      // Skip if already using object storage path
      if (household.photoUrl.startsWith("/objects/")) {
        console.log(`[Photo Migration] Household ${household.id} already using object storage`);
        skippedCount++;
        continue;
      }

      // Only migrate photos in /uploads/ folder
      if (!household.photoUrl.startsWith("/uploads/")) {
        console.log(`[Photo Migration] Skipping unknown path format: ${household.photoUrl}`);
        skippedCount++;
        continue;
      }

      try {
        // Get the local file path
        const uploadsDir = path.join(process.cwd(), "uploads");
        const filename = household.photoUrl.replace("/uploads/", "");
        const localFilePath = path.join(uploadsDir, filename);

        // Check if file exists locally
        let fileBuffer: Buffer;
        try {
          fileBuffer = await fs.readFile(localFilePath);
          console.log(`[Photo Migration] Found local file for household ${household.id}: ${filename}`);
        } catch (fileError) {
          console.warn(`[Photo Migration] Local file not found for household ${household.id}: ${localFilePath}`);
          errorCount++;
          continue;
        }

        // Determine content type from filename
        const ext = path.extname(filename).toLowerCase();
        const contentTypeMap: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
        };
        const contentType = contentTypeMap[ext] || 'image/jpeg';

        // Upload to object storage
        const newUrl = await objectStorageService.uploadFile(
          fileBuffer,
          filename,
          contentType
        );

        console.log(`[Photo Migration] Uploaded household ${household.id} photo to object storage: ${newUrl}`);

        // Update database with new URL
        await db.updateHousehold(household.id, { photoUrl: newUrl });

        console.log(`[Photo Migration] Updated household ${household.id} database record`);
        migratedCount++;

      } catch (error) {
        console.error(`[Photo Migration] Error migrating photo for household ${household.id}:`, error);
        errorCount++;
      }
    }

    console.log(`[Photo Migration] Migration complete!`);
    console.log(`[Photo Migration] - Migrated: ${migratedCount}`);
    console.log(`[Photo Migration] - Skipped: ${skippedCount}`);
    console.log(`[Photo Migration] - Errors: ${errorCount}`);

    return { migratedCount, skippedCount, errorCount };

  } catch (error) {
    console.error("[Photo Migration] Fatal error during migration:", error);
    throw error;
  }
}

// Run migration automatically when script is executed
migratePhotosToObjectStorage()
  .then((result) => {
    console.log("[Photo Migration] Migration completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("[Photo Migration] Migration failed:", error);
    process.exit(1);
  });
