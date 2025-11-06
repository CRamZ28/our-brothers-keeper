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

    // Try object storage first if configured
    if (process.env.PRIVATE_OBJECT_DIR) {
      try {
        const objectStorageService = new ObjectStorageService();
        const url = await objectStorageService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        return res.json({ url, filename: req.file.originalname });
      } catch (storageError) {
        console.warn("Object storage failed, falling back to local storage:", storageError);
      }
    }

    // Fallback to local file storage
    const timestamp = Date.now();
    const filename = `${timestamp}-${req.file.originalname}`;
    const filepath = path.join(uploadsDir, filename);
    
    await fs.writeFile(filepath, req.file.buffer);
    
    // Return URL pointing to our static file endpoint
    const url = `/uploads/${filename}`;
    
    res.json({ url, filename });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

export default router;

