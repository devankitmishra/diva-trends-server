import { db } from "../config/firebase.js"; // Firestore instance
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
// import { requireAdmin } from "../middlewares/authMiddleware.js";

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ------------------------
// Middleware: Admin Only
// ------------------------
const requireAdmin = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Access denied: Admins only" });
    }

    req.user = decoded;
    next();
  });
};

// ------------------------
// Get All Banners (Public)
// ------------------------
export const getBanners = async (req, res) => {
  try {
    const snapshot = await db.collection("banners").where("isActive", "==", true).get();
    const banners = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
};

// ------------------------
// Upload Banner (Admin)
// ------------------------
export const uploadBanner = [
  requireAdmin, // Ensure this runs after verifyToken
  async (req, res) => {
    try {
      const snapshot = await db.collection("banners").get();
      const existingCount = snapshot.size;

      if (existingCount >= 5) {
        return res.status(400).json({
          error: "Maximum limit of 5 banners reached. Please delete one before uploading a new banner.",
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "At least one image is required" });
      }

      const uploadedBanners = [];

      for (const file of req.files) {
        // Multer + Cloudinary stores the uploaded file URL in file.path
        const newBanner = {
          title: req.body.title || null,
          redirectUrl: req.body.redirectUrl || null,
          imageUrl: file.path,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const docRef = await db.collection("banners").add(newBanner);
        uploadedBanners.push({ id: docRef.id, ...newBanner });

        // Stop if we reach max 5 banners
        if (existingCount + uploadedBanners.length >= 5) break;
      }

      res.status(201).json(uploadedBanners);
    } catch (error) {
      console.error("Error uploading banner:", error);
      res.status(500).json({ error: "Failed to upload banner" });
      res.status(500).json({ error: error.message || error });
    }
  },
];

// ------------------------
// Update Banner (Admin)
// ------------------------
export const updateBanner = [
  requireAdmin, // ⬅️ Require admin
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, redirectUrl, isActive } = req.body;

      const updateData = {
        ...(title && { title }),
        ...(redirectUrl && { redirectUrl }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date().toISOString(),
      };

      await db.collection("banners").doc(id).update(updateData);

      res.json({ id, ...updateData });
    } catch (error) {
      console.error("Error updating banner:", error);
      res.status(500).json({ error: "Failed to update banner" });
    }
  },
];

// ------------------------
// Delete Banner (Admin)
// ------------------------
export const deleteBanner = [
  requireAdmin, // ⬅️ Require admin
  async (req, res) => {
    try {
      const { id } = req.params;

      // 1️⃣ Get the banner document
      const docRef = db.collection("banners").doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({ error: "Banner not found" });
      }

      const banner = docSnap.data();

      // 2️⃣ Extract Cloudinary public ID from imageUrl
      // Example URL: https://res.cloudinary.com/ACCOUNT_NAME/image/upload/v1234567890/banners/filename.jpg
      const publicIdMatch = banner.imageUrl.match(/\/banners\/([^\.]+)\./);
      const publicId = publicIdMatch ? `banners/${publicIdMatch[1]}` : null;

      // 3️⃣ Delete image from Cloudinary
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }

      // 4️⃣ Delete Firestore document
      await docRef.delete();

      res.json({ success: true, message: "Banner and image deleted successfully" });
    } catch (error) {
      console.error("Error deleting banner:", error);
      res.status(500).json({ error: "Failed to delete banner" });
    }
  },
];


