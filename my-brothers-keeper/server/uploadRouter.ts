import { Router } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAuth } from "./auth";
import { getUser } from "./db";

const router = Router();

// Content types we accept. HEIC/HEIF are included because iPhones often upload
// in those formats. The list is enforced server-side when the upload token is
// minted, so a tampered client cannot upload arbitrary file types.
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Client-side direct-to-Blob upload.
 *
 * The browser uploads the file straight to Vercel Blob, so large files (videos
 * up to 50MB) never stream through the serverless function — Vercel caps request
 * bodies at ~4.5MB.
 *
 * Files are stored PRIVATELY and namespaced under the uploader's household
 * (`uploads/<householdId>/...`). Downloads are served only via the authenticated
 * `/objects/*` proxy, which re-checks household membership. This route issues a
 * short-lived, scoped upload token after `requireAuth` confirms the session.
 */
router.post("/upload", requireAuth, async (req, res) => {
  const body = req.body as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // requireAuth validated the session; resolve the user's household so we
        // can lock the upload to that household's namespace.
        const userId =
          (res.locals.session?.user as { id?: string } | undefined)?.id ?? null;
        const user = userId ? await getUser(userId) : null;
        if (!user?.householdId) {
          throw new Error("You must belong to a household to upload files.");
        }
        if (user.status !== "active") {
          throw new Error("Your membership must be approved before you can upload files.");
        }

        // The client must upload into its own household's namespace; reject
        // anything else so a tampered client cannot write into another household.
        if (!pathname.startsWith(`uploads/${user.householdId}/`)) {
          throw new Error("Invalid upload path.");
        }

        return {
          access: "private",
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId, householdId: user.householdId }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("[upload] blob stored:", blob.pathname);
      },
    });

    return res.json(jsonResponse);
  } catch (error) {
    console.error(
      "[upload] handleUpload error:",
      error instanceof Error ? error.message : String(error)
    );
    return res.status(400).json({ error: "Upload failed" });
  }
});

export default router;
