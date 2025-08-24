import express from "express";
import {
  sendRegisterOtp,
  verifyRegisterOtp,
  sendLoginOtp,
  verifyLoginOtp,
  refreshAccessToken,
  logout,
} from "../controllers/authController.js";

const router = express.Router();

// Registration
router.post("/register/send-otp", sendRegisterOtp);
router.post("/register/verify-otp", verifyRegisterOtp);

// Login
router.post("/login/send-otp", sendLoginOtp);
router.post("/login/verify-otp", verifyLoginOtp);

// Refresh access token (new route 🚀)
router.post("/refresh", refreshAccessToken);

// Logout
router.post("/logout", logout);

export default router;
