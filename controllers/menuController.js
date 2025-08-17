import { db } from "../config/firebase.js";
import jwt from "jsonwebtoken";

// 🔹 Admin check middleware (inline use in controller)
const requireAdmin = (req) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) throw new Error("No token provided");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.role !== "admin") {
    throw new Error("Access denied: Admins only");
  }

  req.user = decoded;
  return true;
};

// Helper: recursively delete children
const deleteChildren = async (parentId) => {
  const snap = await db.collection("menuItems").where("parentId", "==", parentId).get();

  for (const doc of snap.docs) {
    await deleteChildren(doc.id); // recursive delete children
    await db.collection("menuItems").doc(doc.id).delete();
  }
};

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

// 📌 Get menu (public)
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

// 📌 Create menu item (admin only)
export const createMenuItem = async (req, res) => {
  try {
    requireAdmin(req); // 🔥 check admin

    const { title, path, parentId = null, order = 0, visible = true } = req.body;

    if (!title || !path) {
      return res.status(400).json({ error: "Title and path are required" });
    }

    const newItem = {
      title,
      path,
      parentId,
      order,
      visible,
      fullPath: parentId ? `${parentId}${path}` : path,
    };

    const docRef = await db.collection("menuItems").add(newItem);
    res.status(201).json({ id: docRef.id, ...newItem });
  } catch (err) {
    console.error("Failed to create menu item:", err);
    res.status(403).json({ error: err.message || "Failed to create menu item" });
  }
};

// 📌 Update menu item (admin only)
export const updateMenuItem = async (req, res) => {
  try {
    requireAdmin(req); // 🔥 check admin

    const { id } = req.params;
    const updates = req.body;

    await db.collection("menuItems").doc(id).update(updates);

    const updatedDoc = await db.collection("menuItems").doc(id).get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (err) {
    console.error("Failed to update menu item:", err);
    res.status(403).json({ error: err.message || "Failed to update menu item" });
  }
};

// 📌 Delete menu item (admin only)
export const deleteMenuItem = async (req, res) => {
  try {
    requireAdmin(req); // 🔥 check admin

    const { id } = req.params;

    // Delete children first
    await deleteChildren(id);

    // Delete parent
    await db.collection("menuItems").doc(id).delete();

    res.json({ message: "Menu item and its children deleted" });
  } catch (err) {
    console.error("Failed to delete menu item:", err);
    res.status(403).json({ error: err.message || "Failed to delete menu item" });
  }
};
