import { put, del, type PutBlobResult } from "@vercel/blob";
import { randomUUID } from "crypto";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

/**
 * Thin wrapper around Vercel Blob for SERVER-side storage needs.
 *
 * User-facing uploads now go directly from the browser to Vercel Blob via the
 * client `upload()` helper plus the authenticated `/api/upload` token route
 * (see uploadRouter.ts). That avoids streaming large files (videos up to 50MB)
 * through the serverless function, which Vercel caps at ~4.5MB per request body.
 *
 * This class remains for the cases where the server itself needs to store or
 * remove a blob — e.g. the one-off photo migration script and deleting media
 * when content is removed.
 *
 * Requires the `BLOB_READ_WRITE_TOKEN` environment variable. On Vercel it is
 * injected automatically once a Blob store is connected to the project; locally,
 * pull it with `vercel env pull` or set it in `.env`.
 */
export class ObjectStorageService {
  /**
   * Upload a buffer to Vercel Blob and return its public CDN URL.
   * The URL contains an unguessable random component, so it is effectively
   * private-by-obscurity (matching the prior behavior of the GCS bucket).
   */
  async uploadFile(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const extension = filename.includes(".") ? filename.split(".").pop() : undefined;
    const objectId = randomUUID();
    const pathname = `uploads/${objectId}${extension ? "." + extension : ""}`;

    const blob: PutBlobResult = await put(pathname, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });

    return blob.url;
  }

  /**
   * Delete a previously uploaded blob by its public URL. Best-effort: a failure
   * to delete (e.g. already gone) is logged but never throws to the caller.
   */
  async deleteFile(url: string): Promise<void> {
    if (!url || !url.includes("blob.vercel-storage.com")) {
      return;
    }
    try {
      await del(url);
    } catch (error) {
      console.error(
        "[ObjectStorage] delete failed:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
