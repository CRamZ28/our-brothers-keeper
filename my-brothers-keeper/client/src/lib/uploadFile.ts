import { upload } from "@vercel/blob/client";

/**
 * Upload a single file directly to Vercel Blob from the browser and return an
 * app-relative reference to it.
 *
 * Files are stored as PRIVATE blobs, namespaced under the uploader's household
 * (`uploads/<householdId>/...`). The returned value is NOT the raw blob URL
 * (which is private and not directly fetchable) — it is an `/objects/...` path
 * served by the authenticated proxy in the API, which verifies the viewer is a
 * member of the owning household before streaming the file.
 *
 * The bytes go directly to Blob (never through our serverless function), so this
 * works for large files (videos up to 50MB) that would exceed Vercel's ~4.5MB
 * request-body limit. The server validates the household path prefix and content
 * type when minting the upload token.
 *
 * Throws if the upload fails or the user has no household. Wrap in try/catch.
 */
export async function uploadFile(
  file: File,
  householdId: number | null | undefined
): Promise<string> {
  if (!householdId) {
    throw new Error("You must belong to a household before uploading files.");
  }

  const blob = await upload(`uploads/${householdId}/${file.name}`, file, {
    access: "private",
    handleUploadUrl: "/api/upload",
    contentType: file.type || undefined,
  });

  return `/objects/${blob.pathname}`;
}
