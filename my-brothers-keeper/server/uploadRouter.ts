import { Router } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionUserId } from "./auth";
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
 * This single route serves BOTH phases of the @vercel/blob handshake:
 *   1. token mint  — an authenticated browser request (has the session cookie)
 *   2. completion  — a server-to-server callback FROM Vercel Blob (NO cookie)
 * So the route itself must NOT be behind `requireAuth` (that would 401/500 the
 * completion callback). Instead we authenticate the user inside
 * `onBeforeGenerateToken`, which only runs for phase 1; the completion callback
 * is authenticated by handleUpload via the signed token in its body.
 *
 * Files are stored PRIVATELY and namespaced under the uploader's household
 * (`uploads/<householdId>/...`); downloads are served only via the authenticated
 * `/objects/*` proxy.
 */
router.post("/upload", async (req, res) => {
  const body = req.body as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Authenticate the uploader from the session cookie (present on this,
        // the browser-initiated, token-mint request) and resolve their household.
        const userId = await getSessionUserId(req);
        const user = userId ? await getUser(userId) : null;
        if (!user?.householdId) {
          throw new Error("You must be signed in to a household to upload files.");
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
