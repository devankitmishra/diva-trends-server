import nodemailer from "nodemailer";
import { db } from "../config/firebase.js";
import jwt from "jsonwebtoken";

// Temporary OTP store
let otpStore = {};

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ---------------- SEND OTP FOR REGISTER ----------------
export const sendRegisterOtp = async (req, res) => {
  const { email, phone, name } = req.body;
  if (!email || !phone || !name)
    return res
      .status(400)
      .json({ message: "Email, phone, and name are required" });

  const userRef = db.collection("users").doc(email);
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    return res
      .status(400)
      .json({ message: "User with this email already exists. Try login." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = { otp, phone, name, createdAt: Date.now() };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Diva Trends OTP",
    text: `Your OTP is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP for ${email}: ${otp}`);
    res.json({ message: "OTP sent" , otp: otp }); 
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

  const numericOtp = Number(otp);
  const record = otpStore[email];

  if (!record)
    return res.status(400).json({ message: "Invalid or expired OTP" });

  if (record.otp === numericOtp) {
    const userRef = db.collection("users").doc(email);
    const userData = {
      email,
      name: record.name,
      phone: record.phone,
      role: "customer",
      createdAt: new Date(),
    };
    await userRef.set(userData);
    delete otpStore[email];

    const token = jwt.sign(userData, process.env.JWT_SECRET, {
      expiresIn: "180d",
    });

    await db.collection("activeTokens").doc(token).set({
      email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    });

    return res.json({ message: "User registered successfully", token });
  }

  res.status(400).json({ message: "Invalid OTP" });
};

// ---------------- SEND OTP FOR LOGIN ----------------
export const sendLoginOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const userRef = db.collection("users").doc(email);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    return res
      .status(400)
      .json({ message: "User not found. Please register first." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = { otp, createdAt: Date.now() };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Diva Trends Login OTP",
    text: `Your OTP is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Login OTP for ${email}: ${otp}`);
    res.json({ message: "OTP sent", otp }); // remove OTP in production
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

  const numericOtp = Number(otp);
  const record = otpStore[email];

  if (!record)
    return res.status(400).json({ message: "Invalid or expired OTP" });

  if (record.otp === numericOtp) {
    delete otpStore[email];

    const userRef = db.collection("users").doc(email);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();
    const token = jwt.sign(userData, process.env.JWT_SECRET, {
      expiresIn: "180d",
    });

    await db.collection("activeTokens").doc(token).set({
      email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    });

    return res.json({ message: "Login successful", token });
  }

  res.status(400).json({ message: "Invalid OTP" });
};

// ---------------- LOGOUT ----------------
export const logout = async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(400).json({ message: "Token is required" });

  await db.collection("activeTokens").doc(token).delete();
  return res.json({ message: "Logout successful" });
};

// ---------------- TOKEN VALIDATION MIDDLEWARE ----------------
export const verifyToken = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "No token provided" });

  try {
    const tokenDoc = await db.collection("activeTokens").doc(token).get();
    if (!tokenDoc.exists) {
      return res.status(401).json({ error: "Token expired or logged out" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedUser) => {
      if (err) return res.status(401).json({ error: "Unauthorized" });

      const userRef = db.collection("users").doc(decodedUser.email);
      const userDoc = await userRef.get();
      if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

      req.user = userDoc.data();
      next();
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
