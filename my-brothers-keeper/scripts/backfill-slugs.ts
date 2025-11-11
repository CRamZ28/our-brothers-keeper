import { households } from "../drizzle/schema";
import * as db from "../server/db";

async function backfillSlugs() {
  console.log("Starting slug backfill...");
  
  // Get the database instance  
  const database = await db.getDb();
  if (!database) {
    console.error("Failed to connect to database");
    process.exit(1);
  }
  
  // Get all households
  const allHouseholds = await database.select().from(households);
  console.log(`Found ${allHouseholds.length} households to process`);
  
  for (const household of allHouseholds) {
    if (household.slug) {
      console.log(`Household ${household.id} (${household.name}) already has slug: ${household.slug}`);
      continue;
    }
    
    const slug = await db.generateUniqueSlug(household.name, household.id);
    console.log(`Generating slug for household ${household.id} (${household.name}): ${slug}`);
    
    await db.updateHousehold(household.id, { slug });
    console.log(`Updated household ${household.id} with slug: ${slug}`);
  }
  
  console.log("Slug backfill completed successfully!");
  process.exit(0);
}

backfillSlugs().catch((error) => {
  console.error("Error during backfill:", error);
  process.exit(1);
});
