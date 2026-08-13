import express from "express";

import upload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/detection",
  protect,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required.",
      });
    }

    const imageUrl = `/uploads/detections/${req.file.filename}`;

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      imageUrl,
    });
  },
);

export default router;