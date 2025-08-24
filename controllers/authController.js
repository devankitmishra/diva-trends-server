import nodemailer from "nodemailer";
import { db } from "../config/firebase.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Temporary OTP store
let otpStore = {};

// Mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ---------------- GENERATE TOKENS ----------------
const generateAccessToken = (user) => {
  return jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString("hex"); // long random string
};

// ---------------- SEND OTP FOR REGISTER ----------------
export const sendRegisterOtp = async (req, res) => {
  const { email, phone, name } = req.body;
  if (!email || !phone || !name)
    return res.status(400).json({ message: "Email, phone, and name are required" });

  const userRef = db.collection("users").doc(email);
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    return res.status(400).json({ message: "User already exists. Try login." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = { otp, phone, name, createdAt: Date.now() };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Diva Trends OTP",
      text: `Your OTP is: ${otp}`,
    });
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending OTP", error: err });
  }
};

// ---------------- VERIFY OTP FOR REGISTER ----------------
export const verifyRegisterOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP required" });

  const record = otpStore[email];
  if (!record) return res.status(400).json({ message: "Invalid or expired OTP" });

  if (record.otp !== Number(otp)) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // Create user
  const userData = {
    email,
    name: record.name,
    phone: record.phone,
    role: "customer",
    createdAt: new Date(),
  };
  await db.collection("users").doc(email).set(userData);
  delete otpStore[email];

  // Generate tokens
  const accessToken = generateAccessToken(userData);
  const refreshToken = generateRefreshToken();

  await db.collection("refreshTokens").doc(email).set({
    token: refreshToken,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
  });

  // Set refresh token in HttpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 180 * 24 * 60 * 60 * 1000,
  });

  res.json({ message: "User registered successfully", accessToken });
};

// ---------------- SEND OTP FOR LOGIN ----------------
export const sendLoginOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const userRef = db.collection("users").doc(email);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    return res.status(400).json({ message: "User not found. Please register first." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = { otp, createdAt: Date.now() };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Diva Trends Login OTP",
      text: `Your OTP is: ${otp}`,
    });
    res.json({ message: "OTP sent", otp: otp }); // For testing purposes
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending OTP", error: err });
  }
};

// ---------------- VERIFY OTP FOR LOGIN ----------------
export const verifyLoginOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP required" });

  const record = otpStore[email];
  if (!record) return res.status(400).json({ message: "Invalid or expired OTP" });

  if (record.otp !== Number(otp)) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  delete otpStore[email];

  const userRef = db.collection("users").doc(email);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

  const userData = userDoc.data();

  // Generate tokens
  const accessToken = generateAccessToken(userData);
  const refreshToken = generateRefreshToken();

  await db.collection("refreshTokens").doc(email).set({
    token: refreshToken,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 180 * 24 * 60 * 60 * 1000,
  });

  return res.json({ message: "Login successful", accessToken });
};

// ---------------- REFRESH TOKEN ----------------
export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "No refresh token" });

  const tokenDoc = await db.collection("refreshTokens").doc(req.body.email).get();
  if (!tokenDoc.exists || tokenDoc.data().token !== refreshToken) {
    return res.status(403).json({ error: "Invalid refresh token" });
  }

  const userRef = db.collection("users").doc(req.body.email);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

  const accessToken = generateAccessToken(userDoc.data());
  return res.json({ accessToken });
};

// ---------------- LOGOUT ----------------
export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await db.collection("refreshTokens").doc(req.body.email).delete();
    res.clearCookie("refreshToken");
  }
  return res.json({ message: "Logout successful" });
};
