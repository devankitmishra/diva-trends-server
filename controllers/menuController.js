import dotenv from "dotenv";
dotenv.config();

import { db } from "../config/firebase.js";
import jwt from "jsonwebtoken";
import menu from "../seeds/menu.data.js"; // ⬅️ import your static data

// ✅ helper: require admin token
const requireAdmin = (req) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) throw new Error("No token provided");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.role !== "admin") throw new Error("Access denied: Admins only");
  req.user = decoded;
  return true;
};

// ✅ helper: recursively build the tree for GET
const buildTree = (items, parentId = null) => {
  return items
    .filter((i) => (i.parentId || null) === parentId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((i) => ({
      id: i.id,
      title: i.title,
      path: i.path,
      fullPath: i.fullPath,
      visible: i.visible,
      children: buildTree(items, i.id),
    }));
};

// ✅ helper: clear collection
const clearExisting = async () => {
  const snap = await db.collection("menuItems").get();
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};

// ✅ helper: write menu recursively
const writeItems = async (items, parentId = null, parentFullPath = "") => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const rawPath = item.path || "";
    const isAbsolute = rawPath.startsWith("/");
    const fullPath = isAbsolute
      ? rawPath
      : `${parentFullPath.replace(/\/$/, "")}/${rawPath}`.replace(/\/+/g, "/");

    const data = {
      title: item.title,
      path: rawPath,
      fullPath,
      parentId,
      order: i + 1,
      visible: item.visible !== undefined ? item.visible : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("menuItems").add(data);
    if (Array.isArray(item.children) && item.children.length > 0) {
      await writeItems(item.children, docRef.id, fullPath);
    }
  }
};

// 📌 GET /menu (public)
export const getMenu = async (req, res) => {
  try {
    const snap = await db.collection("menuItems").get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const visibleOnly = items.filter((i) => i.visible !== false);
    const tree = buildTree(visibleOnly, null);
    res.json(tree);
  } catch (err) {
    console.error("Failed to fetch menu:", err);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
};

// 📌 POST /menu/seed (admin only)
export const seedMenu = async (req, res) => {
  try {
    requireAdmin(req);

    await clearExisting();

    if (menu.length > 0) {
      await writeItems(menu, null, "");
    }

    res.json({ message: "Menu seeded successfully" });
  } catch (err) {
    console.error("Seeding failed:", err);
    res.status(403).json({ error: err.message || "Seeding failed" });
  }
};
