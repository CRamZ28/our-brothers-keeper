import { Router } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Upload endpoint
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `uploads/${timestamp}-${req.file.originalname}`;

    // Upload to S3
    const { url } = await storagePut(filename, req.file.buffer, req.file.mimetype);

    res.json({ url, filename });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

export default router;

