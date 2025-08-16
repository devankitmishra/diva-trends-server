import express from "express";
import { getBanners, uploadBanner, updateBanner, deleteBanner } from "../controllers/bannerController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import upload from "../config/multer.js";

const router = express.Router();

// Public
router.get("/", getBanners);

// Protected (Admin Only)
router.post("/", verifyToken, upload.array("images"), uploadBanner); // multiple files
router.put("/:id", verifyToken, updateBanner);
router.delete("/:id", verifyToken, deleteBanner);

export default router;
