// server/seeds/seedMenu.js
import dotenv from "dotenv";
dotenv.config(); // ensure env is loaded for firebase config

import { db } from "../config/firebase.js";
import menu from "./menu.data.js";

/**
 * Recursively writes items to Firestore (collection: menuItems)
 * Adds fields:
 * - parentId (null for root)
 * - order (1-based index)
 * - visible (default true)
 * - fullPath (computed from parentPath + item.path)
 */
async function writeItems(items, parentId = null, parentFullPath = "") {
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
    console.log(`✓ Added: ${data.title} (${docRef.id})  -> ${data.fullPath}`);

    if (Array.isArray(item.children) && item.children.length > 0) {
      await writeItems(item.children, docRef.id, fullPath);
    }
  }
}

async function clearExisting() {
  const snap = await db.collection("menuItems").get();
  const batchSize = snap.size;
  if (batchSize === 0) return;

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Cleared ${batchSize} existing menuItems.`);
}

(async () => {
  try {
    // OPTIONAL: clear before seeding (uncomment if you want a clean slate)
    await clearExisting();

    await writeItems(menu, null, "");
    console.log("🎉 Menu seeded successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
})();
