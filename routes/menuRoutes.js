import express from "express";
import { getMenu, seedMenu } from "../controllers/menuController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public — fetch sidebar
router.get("/", getMenu);

// Admin — reseed menu from menu.data.js
router.post("/seed", verifyToken, seedMenu);

export default router;
