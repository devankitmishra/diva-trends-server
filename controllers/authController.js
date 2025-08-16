const nodemailer = require("nodemailer");
const db = require("../config/firebase");
const jwt = require("jsonwebtoken");

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
exports.sendRegisterOtp = async (req, res) => {
  const { email, phone, name } = req.body;
  if (!email || !phone || !name)
    return res.status(400).json({ message: "Email, phone, and name are required" });

  const userRef = db.collection("users").doc(email);
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    return res.status(400).json({ message: "User with this email already exists. Try login." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = { otp, phone, name, createdAt: Date.now() }; // store user data temporarily

  // Send OTP email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Diva Trends OTP",
    text: `Your OTP is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP for ${email}: ${otp}`);
    res.json({ message: "OTP sent", otp }); // for dev
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending OTP", error: err });
  }
};

// ---------------- VERIFY OTP FOR REGISTER ----------------
exports.verifyRegisterOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP required" });

  const numericOtp = Number(otp);
  const record = otpStore[email];

  if (!record) return res.status(400).json({ message: "Invalid or expired OTP" });

  if (record.otp === numericOtp) {
    const userRef = db.collection("users").doc(email);
    await userRef.set({
      email,
      name: record.name,
      phone: record.phone,
      createdAt: new Date(),
    });

    delete otpStore[email];

    // Generate JWT token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({ message: "User registered successfully", token });
  }

  res.status(400).json({ message: "Invalid OTP" });
};

// ---------------- SEND OTP FOR LOGIN ----------------
exports.sendLoginOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const userRef = db.collection("users").doc(email);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    return res.status(400).json({ message: "User not found. Please register first." });
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
    res.json({ message: "OTP sent", otp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending OTP", error: err });
  }
};

// ---------------- VERIFY OTP FOR LOGIN ----------------
exports.verifyLoginOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP required" });

  const numericOtp = Number(otp);
  const record = otpStore[email];

  if (!record) return res.status(400).json({ message: "Invalid or expired OTP" });

  if (record.otp === numericOtp) {
    delete otpStore[email];

    // Generate JWT token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({ message: "Login successful", token });
  }

  res.status(400).json({ message: "Invalid OTP" });
};
