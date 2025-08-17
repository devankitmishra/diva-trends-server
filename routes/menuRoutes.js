import express from "express";
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from "../controllers/menuController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public — fetch sidebar
router.get("/", getMenu);

// Admin — manage menu
router.post("/", verifyToken, createMenuItem);
router.put("/:id", verifyToken, updateMenuItem);
router.delete("/:id", verifyToken, deleteMenuItem);

export default router;
