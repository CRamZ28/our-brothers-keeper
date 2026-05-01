import "dotenv/config";
import { createServer } from "http";
import { createApp } from "./app";
import { serveStatic, setupVite } from "./vite";
import { processAutoPromotions } from "../autoPromotion";
import { processReminders } from "../reminderProcessor";
import { ENV } from "./env";

async function startServer() {
  console.log("[ObjectStorage] Configuration:", {
    PRIVATE_OBJECT_DIR: process.env.PRIVATE_OBJECT_DIR || "NOT SET",
    PUBLIC_OBJECT_SEARCH_PATHS: process.env.PUBLIC_OBJECT_SEARCH_PATHS || "NOT SET",
  });

  const app = await createApp();
  const server = createServer(app);

  if (!ENV.isProduction) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000");

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    console.log(`Replit Auth enabled`);

    processAutoPromotions()
      .then(() => console.log("[AutoPromotion] Initial auto-promotion check completed"))
      .catch((error) => console.error("[AutoPromotion] Error during initial auto-promotion check:", error));

    const autoPromotionInterval = setInterval(() => {
      processAutoPromotions().catch((error) =>
        console.error("[AutoPromotion] Error during scheduled auto-promotion:", error)
      );
    }, 3600000);

    processReminders()
      .then(() => console.log("[Reminders] Initial reminder check completed"))
      .catch((error) => console.error("[Reminders] Error during initial reminder check:", error));

    const reminderInterval = setInterval(() => {
      processReminders().catch((error) =>
        console.error("[Reminders] Error during scheduled reminder processing:", error)
      );
    }, 900000);

    process.on("SIGTERM", () => {
      console.log("[AutoPromotion] Cleaning up auto-promotion interval");
      console.log("[Reminders] Cleaning up reminder interval");
      clearInterval(autoPromotionInterval);
      clearInterval(reminderInterval);
    });

    console.log("[AutoPromotion] Background job scheduled to run every hour");
    console.log("[Reminders] Background job scheduled to run every 15 minutes");
  });
}

startServer().catch(console.error);
