import { Router } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAuth } from "./auth";

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
 * bodies at ~4.5MB, which made the old multipart-through-the-function flow fail
 * for anything but small images.
 *
 * This single route handles BOTH phases of the @vercel/blob/client `upload()`
 * handshake:
 *   1. mint a short-lived, scoped upload token (onBeforeGenerateToken)
 *   2. record completion (onUploadCompleted) — only fires when the server is
 *      publicly reachable (i.e. on Vercel, not localhost); we don't depend on it.
 *
 * `requireAuth` guarantees only signed-in users can obtain an upload token,
 * fixing the previous behavior where the upload endpoint was unauthenticated.
 */
router.post("/upload", requireAuth, async (req, res) => {
  const body = req.body as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        // requireAuth has already validated the session, so the user is
        // authenticated by the time we get here. Capture who is uploading.
        const userId =
          (res.locals.session?.user as { id?: string } | undefined)?.id ?? null;

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId }),
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
    // 400: the client SDK surfaces this as an upload failure.
    return res.status(400).json({ error: "Upload failed" });
  }
});

export default router;
