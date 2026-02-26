// Local-filesystem object storage — replacement for Replit Object Storage.
//
// In development this stores files under an `uploads/` directory at the
// project root.  For production, swap the implementation body with AWS S3,
// Cloudflare R2, or any S3-compatible client (the AWS SDK is already in
// package.json).  The public interface (ObjectStorageService,
// ObjectNotFoundError) is consumed by uploadRouter.ts and
// server/_core/index.ts and must keep its shape stable.
//
// Production env vars you would need for S3 / R2:
//   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME
//   (plus S3_ENDPOINT for R2 / MinIO)

import { Response } from "express";
import { randomUUID } from "crypto";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";

/** Root directory where uploads are stored on disk. */
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

// Ensure the uploads directory tree exists at module load time
fs.mkdirSync(path.join(UPLOADS_ROOT, "uploads"), { recursive: true });

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

/** Metadata object returned by getObjectEntityFile — replaces GCS File. */
export type LocalFile = { filePath: string; contentType: string };

/**
 * Thin wrapper around the local filesystem that mirrors the interface
 * previously provided by Replit's Google Cloud Storage sidecar.
 */
export class ObjectStorageService {
  constructor() {}

  /**
   * Upload a file buffer to local storage.
   * Returns a URL path like `/objects/uploads/<uuid>.<ext>` that can be
   * persisted in the database and later served by the /objects/* route.
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    const objectId = randomUUID();
    const extension = filename.split(".").pop();
    const storedName = `${objectId}${extension ? "." + extension : ""}`;
    const destDir = path.join(UPLOADS_ROOT, "uploads");
    await fsp.mkdir(destDir, { recursive: true });
    const destPath = path.join(destDir, storedName);

    console.log("[ObjectStorage] Upload attempt:", {
      filename,
      contentType,
      bufferSize: buffer.length,
      destPath,
    });

    await fsp.writeFile(destPath, buffer);

    console.log("[ObjectStorage] Upload successful:", { storedName });

    return `/objects/uploads/${storedName}`;
  }

  /**
   * Resolve an `/objects/...` URL path to an on-disk file and verify that the
   * file exists.  Returns a lightweight metadata object that downloadObject()
   * can consume.
   */
  async getObjectEntityFile(objectPath: string): Promise<LocalFile> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const relativePart = objectPath.slice("/objects/".length);
    if (!relativePart) {
      throw new ObjectNotFoundError();
    }

    const filePath = path.join(UPLOADS_ROOT, relativePart);

    // Prevent directory-traversal attacks
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(UPLOADS_ROOT))) {
      throw new ObjectNotFoundError();
    }

    try {
      await fsp.access(filePath, fs.constants.R_OK);
    } catch {
      throw new ObjectNotFoundError();
    }

    const ext = path.extname(filePath).toLowerCase();
    const MIME_MAP: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mov": "video/quicktime",
      ".pdf": "application/pdf",
    };
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    return { filePath, contentType };
  }

  /**
   * Stream a previously-resolved file to an Express response.
   */
  async downloadObject(
    file: LocalFile,
    res: Response,
    cacheTtlSec: number = 3600,
  ) {
    try {
      const stat = await fsp.stat(file.filePath);

      res.set({
        "Content-Type": file.contentType,
        "Content-Length": String(stat.size),
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      const stream = fs.createReadStream(file.filePath);
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  /**
   * Convert legacy Google Cloud Storage URLs or /uploads/ paths to the
   * canonical `/objects/...` format.  Local paths already in that format pass
   * through unchanged.
   */
  normalizeObjectEntityPath(rawPath: string): string {
    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }
    if (rawPath.startsWith("/uploads/")) {
      return `/objects${rawPath}`;
    }
    if (rawPath.startsWith("https://storage.googleapis.com/")) {
      const url = new URL(rawPath);
      const parts = url.pathname.split("/").slice(2).join("/");
      return `/objects/${parts}`;
    }
    return rawPath;
  }
}
