const express = require("express");
const router = express.Router();
const {
  sendRegisterOtp,
  verifyRegisterOtp,
  sendLoginOtp,
  verifyLoginOtp,
} = require("../controllers/authController");

// Registration
router.post("/register/send-otp", sendRegisterOtp);
router.post("/register/verify-otp", verifyRegisterOtp);

// Login
router.post("/login/send-otp", sendLoginOtp);
router.post("/login/verify-otp", verifyLoginOtp);

module.exports = router;
