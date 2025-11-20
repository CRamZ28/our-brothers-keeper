import { Router } from "express";
import multer from "multer";
import { ObjectStorageService } from "./objectStorage";
import fs from "fs/promises";
import path from "path";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Upload endpoint
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Always use object storage - no fallback to local files
    // Local files don't persist in autoscale deployments
    if (!process.env.PRIVATE_OBJECT_DIR) {
      console.error("Object storage not configured - PRIVATE_OBJECT_DIR missing");
      return res.status(500).json({ 
        error: "File storage not configured. Please set up object storage." 
      });
    }

    console.log("Starting upload:", {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      objectDir: process.env.PRIVATE_OBJECT_DIR,
    });

    const objectStorageService = new ObjectStorageService();
    const url = await objectStorageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    
    console.log("Upload successful:", url);
    res.json({ url, filename: req.file.originalname });
  } catch (error) {
    console.error("Upload error details:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      filename: req.file?.originalname,
    });
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;

