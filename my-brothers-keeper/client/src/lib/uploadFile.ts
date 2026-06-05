import { upload } from "@vercel/blob/client";

/**
 * Upload a single file directly to Vercel Blob from the browser and return its
 * public URL.
 *
 * The file is sent straight to Blob storage — it never passes through our
 * serverless function — so this works for large files (videos up to 50MB) that
 * would otherwise exceed Vercel's ~4.5MB request-body limit. The `/api/upload`
 * route only issues a short-lived, authenticated upload token; the actual bytes
 * go directly to Blob.
 *
 * Throws if the upload fails (e.g. unauthenticated, disallowed type, too large),
 * so call sites should wrap this in try/catch.
 */
export async function uploadFile(file: File): Promise<string> {
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    contentType: file.type || undefined,
  });

  return blob.url;
}
