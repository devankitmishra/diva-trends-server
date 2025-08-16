import jwt from "jsonwebtoken";
import { db } from "../config/firebase.js"; // Firestore instance

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(403).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];

    // 🔹 Check if token exists in Firestore (active tokens)
    const tokenDoc = await db.collection("activeTokens").doc(token).get();
    if (!tokenDoc.exists) {
      return res.status(401).json({ error: "Token invalid or expired. Please login again." });
    }

    // 🔹 Verify JWT signature + expiry
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ error: "Unauthorized" });

      req.user = decoded; // { email, role, iat, exp }
      next();
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
